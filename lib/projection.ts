// Maps between Street View camera angles and screen pixels, so overlays can
// stick to the scene. Street View renders a rectilinear (pinhole) view, so
// straight lines in the world stay straight on screen.

export interface CameraPov {
  heading: number;
  pitch: number;
  zoom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** A unit direction: x = east, y = up, z = north. */
export type Vec = [number, number, number];

const RAD = Math.PI / 180;

/** Horizontal field of view (degrees) for a Street View zoom level. */
export function horizontalFov(zoom: number) {
  // Zoom 1 is 90° across the view's width, and each zoom step halves it. The renderer caps
  // wide zooms at about 127° (zoom 0). Both were checked against the live panorama.
  return Math.min(180 / 2 ** zoom, MAX_FOV);
}
const MAX_FOV = 127;

export function direction(heading: number, pitch: number): Vec {
  const h = heading * RAD;
  const p = pitch * RAD;
  return [Math.cos(p) * Math.sin(h), Math.sin(p), Math.cos(p) * Math.cos(h)];
}

export function angles(v: Vec) {
  const [x, y, z] = normalize(v);
  return { heading: ((Math.atan2(x, z) / RAD) % 360 + 360) % 360, pitch: Math.asin(Math.max(-1, Math.min(1, y))) / RAD };
}

export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize = (v: Vec): Vec => {
  const n = Math.hypot(...v) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
};

function basis(pov: CameraPov) {
  const h = pov.heading * RAD;
  const p = pov.pitch * RAD;
  const forward: Vec = [Math.cos(p) * Math.sin(h), Math.sin(p), Math.cos(p) * Math.cos(h)];
  const right: Vec = [Math.cos(h), 0, -Math.sin(h)];
  const up: Vec = [-Math.sin(p) * Math.sin(h), Math.cos(p), -Math.sin(p) * Math.cos(h)];
  return { forward, right, up };
}

const focalLength = (pov: CameraPov, view: Viewport) =>
  view.width / 2 / Math.tan((horizontalFov(pov.zoom) / 2) * RAD);

/** Screen position of a direction, or null when it's behind the camera. */
export function project(v: Vec, pov: CameraPov, view: Viewport) {
  const { forward, right, up } = basis(pov);
  const z = dot(v, forward);
  if (z <= 1e-6) return null;
  const f = focalLength(pov, view);
  return { x: view.width / 2 + (f * dot(v, right)) / z, y: view.height / 2 - (f * dot(v, up)) / z };
}

/** Direction under a screen point. */
export function unproject(x: number, y: number, pov: CameraPov, view: Viewport): Vec {
  const { forward, right, up } = basis(pov);
  const f = focalLength(pov, view);
  const sx = (x - view.width / 2) / f;
  const sy = -(y - view.height / 2) / f;
  return normalize([
    forward[0] + sx * right[0] + sy * up[0],
    forward[1] + sx * right[1] + sy * up[1],
    forward[2] + sx * right[2] + sy * up[2],
  ]);
}

/** Screen y of the eye-level (horizon) line; it stays horizontal because Street View never rolls. */
export function horizonY(pov: CameraPov, view: Viewport) {
  return view.height / 2 + focalLength(pov, view) * Math.tan(pov.pitch * RAD);
}

/** Smallest signed difference between two headings, in degrees (-180, 180]. */
export function headingDelta(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
