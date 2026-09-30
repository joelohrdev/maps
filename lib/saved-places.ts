import { createLocalStore } from "./local-store";

export type SketchStatus = "todo" | "sketched";

export interface SavedPlace {
  id: string;
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  zoom: number;
  title: string;
  /** "near Kyoto, Japan"-style label from the nearest seed city. */
  near: string;
  note: string;
  tags: string[];
  status: SketchStatus;
  savedAt: string;
  /** Colors picked from this view, as hex; the gallery shows how to mix each one. */
  colors?: string[];
  /** Last local edit; sync keeps whichever copy of a spot changed most recently. */
  updatedAt?: string;
}

export const SUGGESTED_TAGS = [
  "Architecture",
  "Street scene",
  "Café",
  "Market",
  "Waterfront",
  "Park",
  "Landmark",
  "Interior",
  "Perspective practice",
];

function isSavedPlace(x: unknown): x is SavedPlace {
  const p = x as SavedPlace;
  return !!p && typeof p.id === "string" && typeof p.panoId === "string" && typeof p.lat === "number";
}

export const savedStore = createLocalStore<SavedPlace[]>("sketch-atlas:saved", [], (raw) =>
  Array.isArray(raw) ? raw.filter(isSavedPlace) : [],
);

/** Spot id → ISO time it was deleted, kept until sync tells the server. */
export const deletedStore = createLocalStore<Record<string, string>>("sketch-atlas:deleted", {}, (raw) =>
  raw && typeof raw === "object" ? (raw as Record<string, string>) : {},
);

export const lastChanged = (p: SavedPlace) => p.updatedAt ?? p.savedAt;

export function upsertPlace(input: SavedPlace) {
  const place = { ...input, updatedAt: new Date().toISOString() };
  savedStore.set((prev) => {
    const i = prev.findIndex((p) => p.id === place.id);
    if (i === -1) return [place, ...prev];
    const next = [...prev];
    next[i] = place;
    return next;
  });
}

export function removePlace(id: string) {
  deletedStore.set((d) => ({ ...d, [id]: new Date().toISOString() }));
  savedStore.set((prev) => prev.filter((p) => p.id !== id));
}

/** Merge imported places, keeping existing entries when ids collide. Returns how many were added. */
export function importPlaces(raw: unknown): number {
  if (!Array.isArray(raw)) throw new Error("Expected a JSON array of saved places.");
  const incoming = raw.filter(isSavedPlace);
  let added = 0;
  savedStore.set((prev) => {
    const ids = new Set(prev.map((p) => p.id));
    const now = new Date().toISOString();
    const fresh = incoming.filter((p) => !ids.has(p.id)).map((p) => ({ ...p, updatedAt: now }));
    added = fresh.length;
    return [...fresh, ...prev];
  });
  return added;
}

export function streetViewImageUrl(
  place: Pick<SavedPlace, "panoId" | "heading" | "pitch" | "zoom">,
  apiKey: string,
  size = "400x260",
) {
  const fov = Math.round(180 / 2 ** Math.max(place.zoom, 0));
  const params = new URLSearchParams({
    size,
    pano: place.panoId,
    heading: String(Math.round(place.heading)),
    pitch: String(Math.round(place.pitch)),
    fov: String(Math.min(Math.max(fov, 10), 120)),
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}

export function googleMapsUrl(place: Pick<SavedPlace, "panoId" | "lat" | "lng" | "heading" | "pitch">) {
  const params = new URLSearchParams({
    api: "1",
    map_action: "pano",
    pano: place.panoId,
    viewpoint: `${place.lat},${place.lng}`,
    heading: String(Math.round(place.heading)),
    pitch: String(Math.round(place.pitch)),
  });
  return `https://www.google.com/maps/@?${params}`;
}

export function explorerUrl(place: Pick<SavedPlace, "panoId" | "heading" | "pitch" | "zoom">) {
  const params = new URLSearchParams({
    pano: place.panoId,
    h: place.heading.toFixed(1),
    p: place.pitch.toFixed(1),
    z: place.zoom.toFixed(1),
  });
  return `/?${params}`;
}
