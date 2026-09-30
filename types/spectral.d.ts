// Minimal types for spectral.js (Kubelka–Munk paint mixing), which ships without any.
declare module "spectral.js" {
  export class Color {
    constructor(color: string | number[]);
    readonly sRGB: number[];
    readonly OKLab: number[];
    readonly luminance: number;
    tintingStrength: number;
    toString(options?: { format?: "hex" | "rgb"; method?: "map" | "clip" }): string;
  }
  export function mix(...colors: [Color, number][]): Color;
}
