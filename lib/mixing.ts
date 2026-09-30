import { Color, mix } from "spectral.js";

export interface MixPaint {
  id: string;
  name: string;
  hex: string;
}

export interface Recipe {
  parts: { paint: MixPaint; parts: number }[];
  /** What the mix should look like. */
  hex: string;
  /** OKLab distance from the target; about 0.02 is barely noticeable. */
  distance: number;
}

const MAX_TOTAL_PARTS = 10;
/** Extra paints make mixes muddier and harder to repeat, so each one must earn its place. */
const EXTRA_PAINT_PENALTY = 0.006;
/** Only the most promising paints are tried in three-paint mixes, which keeps the search fast. */
const TRIPLE_SHORTLIST = 10;

const colorCache = new Map<string, Color>();
function toColor(hex: string) {
  let c = colorCache.get(hex);
  if (!c) colorCache.set(hex, (c = new Color(hex)));
  return c;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** Every way to split up to MAX_TOTAL_PARTS parts between n paints, in lowest terms. */
function ratios(n: number): number[][] {
  const out: number[][] = [];
  const walk = (prefix: number[], left: number) => {
    if (prefix.length === n) {
      if (prefix.reduce(gcd) === 1) out.push(prefix);
      return;
    }
    for (let p = 1; p <= left - (n - prefix.length - 1); p++) walk([...prefix, p], left - p);
  };
  walk([], MAX_TOTAL_PARTS);
  return out;
}

const RATIOS: Record<number, number[][]> = { 1: [[1]], 2: ratios(2), 3: ratios(3) };

const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function bestMix(paints: MixPaint[], target: number[]): Recipe {
  const colors = paints.map((p) => toColor(p.hex));
  let best: Recipe | null = null;
  for (const ratio of RATIOS[paints.length]) {
    const mixed = paints.length === 1 ? colors[0] : mix(...colors.map((c, i): [Color, number] => [c, ratio[i]]));
    const d = distance(mixed.OKLab, target);
    if (!best || d < best.distance) {
      best = { parts: paints.map((paint, i) => ({ paint, parts: ratio[i] })), hex: mixed.toString(), distance: d };
    }
  }
  return best!;
}

const score = (r: Recipe) => r.distance + EXTRA_PAINT_PENALTY * (r.parts.length - 1);

/**
 * Finds the closest mixes of one, two or three of `paints` to `targetHex`,
 * using Kubelka–Munk pigment mixing (so blue + yellow makes green, not gray).
 */
export function findRecipes(targetHex: string, paints: MixPaint[], limit = 3): Recipe[] {
  if (paints.length === 0) return [];
  const target = toColor(targetHex).OKLab;
  const candidates: Recipe[] = paints.map((p) => bestMix([p], target));

  for (let i = 0; i < paints.length; i++) {
    for (let j = i + 1; j < paints.length; j++) candidates.push(bestMix([paints[i], paints[j]], target));
  }

  const shortlist: MixPaint[] = [];
  for (const r of [...candidates].sort((a, b) => a.distance - b.distance)) {
    for (const { paint } of r.parts) if (!shortlist.includes(paint)) shortlist.push(paint);
    if (shortlist.length >= TRIPLE_SHORTLIST) break;
  }
  for (let i = 0; i < shortlist.length; i++) {
    for (let j = i + 1; j < shortlist.length; j++) {
      for (let k = j + 1; k < shortlist.length; k++) {
        candidates.push(bestMix([shortlist[i], shortlist[j], shortlist[k]], target));
      }
    }
  }

  // Best first. Skip a recipe that only adds paints to a better one: it's the
  // same idea with a tweak, and genuinely different options are more useful.
  const results: Recipe[] = [];
  const ids = (r: Recipe) => r.parts.map((p) => p.paint.id);
  for (const r of candidates.sort((a, b) => score(a) - score(b))) {
    const mine = ids(r);
    if (results.some((x) => ids(x).every((id) => mine.includes(id)))) continue;
    results.push(r);
    if (results.length === limit) break;
  }
  return results;
}

export function matchLabel(distance: number) {
  if (distance < 0.02) return { label: "Spot on", tone: "good" as const };
  if (distance < 0.05) return { label: "Close match", tone: "good" as const };
  if (distance < 0.1) return { label: "Rough match", tone: "ok" as const };
  return { label: "Not close. You may need another paint", tone: "bad" as const };
}
