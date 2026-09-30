import { createLocalStore } from "./local-store";

export type Frame = "none" | "square" | "portrait" | "landscape" | "panorama";
export type Tone = "color" | "gray" | "notan" | "values3" | "values5";

export interface DrawingAids {
  frame: Frame;
  grid: boolean;
  horizon: boolean;
  tone: Tone;
}

/** Ratio is width / height. A-series paper is 1 : √2. */
export const FRAME_OPTIONS: { value: Frame; label: string; ratio: number }[] = [
  { value: "none", label: "Full view", ratio: 0 },
  { value: "square", label: "Square", ratio: 1 },
  { value: "portrait", label: "A-size portrait", ratio: 1 / Math.SQRT2 },
  { value: "landscape", label: "A-size landscape", ratio: Math.SQRT2 },
  { value: "panorama", label: "Panorama 3:1", ratio: 3 },
];

// Discrete brightness levels for the value studies (0 = black, 1 = white).
export const TONE_OPTIONS: { value: Tone; label: string; levels?: string }[] = [
  { value: "color", label: "Color" },
  { value: "gray", label: "Grayscale" },
  { value: "notan", label: "Notan (2 values)", levels: "0.08 0.95" },
  { value: "values3", label: "3 values", levels: "0.1 0.52 0.94" },
  { value: "values5", label: "5 values", levels: "0.06 0.3 0.55 0.78 0.96" },
];

export function toneFilter(tone: Tone) {
  if (tone === "color") return undefined;
  if (tone === "gray") return "grayscale(1)";
  return `url(#tone-${tone})`;
}

export const DEFAULT_AIDS: DrawingAids = { frame: "none", grid: false, horizon: false, tone: "color" };

export const aidsStore = createLocalStore<DrawingAids>("sketch-atlas:aids", DEFAULT_AIDS, (raw) => ({
  ...DEFAULT_AIDS,
  ...(raw as Partial<DrawingAids>),
}));
