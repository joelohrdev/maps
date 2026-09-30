import { createLocalStore } from "./local-store";
import type { MixPaint } from "./mixing";

export interface Paint extends MixPaint {
  /** Colour Index pigment code, e.g. "PB29". */
  pigment?: string;
}

/** Watercolor lightens with water (the paper shows through); opaque paints need white. */
export type Medium = "watercolor" | "opaque";

export interface Palette {
  medium: Medium;
  paints: Paint[];
  /** Recently picked target colors, newest first. Per device; not synced. */
  recent: string[];
  /** Last change to medium or paints; sync keeps whichever copy changed most recently. */
  updatedAt?: string;
}

/** Stands in for diluting watercolor: in the mixing model, thinning a wash acts much like adding white. */
export const WATER: Paint = { id: "water", name: "Water (dilute)", hex: "#fbfaf6" };

// Common single-pigment artist colors. Hex values approximate each paint's
// full-strength (masstone) look; brands vary, so users can adjust them.
export const CATALOG: Paint[] = [
  { id: "titanium-white", name: "Titanium White", pigment: "PW6", hex: "#f4f3ee" },
  { id: "lemon-yellow", name: "Lemon Yellow", pigment: "PY175", hex: "#f1e12e" },
  { id: "hansa-yellow-medium", name: "Hansa Yellow Medium", pigment: "PY97", hex: "#f5c711" },
  { id: "cadmium-yellow", name: "Cadmium Yellow Medium", pigment: "PY35", hex: "#f6b300" },
  { id: "naples-yellow", name: "Naples Yellow", hex: "#ecd49a" },
  { id: "yellow-ochre", name: "Yellow Ochre", pigment: "PY43", hex: "#c8902c" },
  { id: "quinacridone-gold", name: "Quinacridone Gold", pigment: "PO49", hex: "#c5821f" },
  { id: "raw-sienna", name: "Raw Sienna", pigment: "PBr7", hex: "#b9743a" },
  { id: "cadmium-orange", name: "Cadmium Orange", pigment: "PO20", hex: "#ec781d" },
  { id: "pyrrol-scarlet", name: "Pyrrol Scarlet", pigment: "PR255", hex: "#e1392b" },
  { id: "cadmium-red", name: "Cadmium Red Medium", pigment: "PR108", hex: "#c62a21" },
  { id: "quinacridone-rose", name: "Quinacridone Rose", pigment: "PV19", hex: "#c7275e" },
  { id: "permanent-alizarin", name: "Permanent Alizarin Crimson", pigment: "PR177", hex: "#8f1c2f" },
  { id: "quinacridone-magenta", name: "Quinacridone Magenta", pigment: "PR122", hex: "#ad2f6c" },
  { id: "dioxazine-violet", name: "Dioxazine Violet", pigment: "PV23", hex: "#3f1f5b" },
  { id: "ultramarine", name: "Ultramarine Blue", pigment: "PB29", hex: "#253b93" },
  { id: "cobalt-blue", name: "Cobalt Blue", pigment: "PB28", hex: "#2054a3" },
  { id: "cerulean-blue", name: "Cerulean Blue", pigment: "PB35", hex: "#2d80b8" },
  { id: "phthalo-blue", name: "Phthalo Blue (Green Shade)", pigment: "PB15:3", hex: "#103b6f" },
  { id: "prussian-blue", name: "Prussian Blue", pigment: "PB27", hex: "#1b2b45" },
  { id: "indanthrone-blue", name: "Indanthrone Blue", pigment: "PB60", hex: "#242d53" },
  { id: "phthalo-green", name: "Phthalo Green (Blue Shade)", pigment: "PG7", hex: "#0c5e4f" },
  { id: "viridian", name: "Viridian", pigment: "PG18", hex: "#1d7a64" },
  { id: "sap-green", name: "Sap Green", hex: "#4b6c20" },
  { id: "hookers-green", name: "Hooker's Green", hex: "#2f5b2f" },
  { id: "perylene-green", name: "Perylene Green", pigment: "PBk31", hex: "#23332b" },
  { id: "indian-red", name: "Indian Red", pigment: "PR101", hex: "#8b3b2d" },
  { id: "burnt-sienna", name: "Burnt Sienna", pigment: "PBr7", hex: "#8b3c1f" },
  { id: "raw-umber", name: "Raw Umber", pigment: "PBr7", hex: "#5c4b37" },
  { id: "burnt-umber", name: "Burnt Umber", pigment: "PBr7", hex: "#4b2f22" },
  { id: "sepia", name: "Sepia", hex: "#3f2e23" },
  { id: "paynes-gray", name: "Payne's Gray", hex: "#2f3b46" },
  { id: "neutral-tint", name: "Neutral Tint", hex: "#35373c" },
  { id: "ivory-black", name: "Ivory Black", pigment: "PBk9", hex: "#201e1d" },
];

export const isPaint = (p: unknown): p is Paint => {
  const x = p as Paint;
  return !!x && typeof x.id === "string" && typeof x.name === "string" && /^#[0-9a-f]{6}$/i.test(x.hex);
};

export const DEFAULT_PALETTE: Palette = { medium: "watercolor", paints: [], recent: [] };

export const paletteStore = createLocalStore<Palette>("sketch-atlas:palette", DEFAULT_PALETTE, (raw) => {
  const p = { ...DEFAULT_PALETTE, ...(raw as Partial<Palette>) };
  return {
    medium: p.medium === "opaque" ? "opaque" : "watercolor",
    paints: Array.isArray(p.paints) ? p.paints.filter(isPaint) : [],
    recent: Array.isArray(p.recent) ? p.recent.filter((h) => /^#[0-9a-f]{6}$/i.test(h)).slice(0, 8) : [],
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
  };
});

/** Paints the solver may use: watercolor always has water available, and never needs white paint. */
export function mixablePaints(paints: Paint[], medium: Medium): Paint[] {
  if (medium === "opaque") return paints;
  return [...paints.filter((p) => p.id !== "titanium-white"), WATER];
}

// Edits to medium or paints go through here so updatedAt stays correct for sync.
function editPalette(change: (p: Palette) => Partial<Palette>) {
  paletteStore.set((p) => ({ ...p, ...change(p), updatedAt: new Date().toISOString() }));
}

export function setMedium(medium: Medium) {
  editPalette(() => ({ medium }));
}

export function addPaint(paint: Paint) {
  if (paletteStore.get().paints.some((x) => x.id === paint.id)) return;
  editPalette((p) => ({ paints: [...p.paints, paint] }));
}

export function updatePaint(id: string, patch: Partial<Paint>) {
  editPalette((p) => ({ paints: p.paints.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
}

export function removePaint(id: string) {
  editPalette((p) => ({ paints: p.paints.filter((x) => x.id !== id) }));
}

export function rememberPick(hex: string) {
  paletteStore.set((p) => ({ ...p, recent: [hex, ...p.recent.filter((h) => h !== hex)].slice(0, 8) }));
}
