import { useSyncExternalStore } from "react";
import type { CameraPov, Viewport } from "./projection";

/**
 * Live Street View camera, shared with the overlays. Kept outside React state
 * so dragging the view re-renders only the overlays, not the whole explorer.
 */
export interface CameraState {
  pov: CameraPov;
  view: Viewport;
  /** Headings of the roads leading away from this panorama. */
  streetHeadings: number[];
}

let state: CameraState = {
  pov: { heading: 0, pitch: 0, zoom: 1 },
  view: { width: 0, height: 0 },
  streetHeadings: [],
};
const initial = state;
const listeners = new Set<() => void>();

export function setCamera(patch: Partial<CameraState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getCamera() {
  return state;
}

export function useCamera() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}
