"use client";

import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/lib/camera";
import {
  angles,
  cross,
  direction,
  dot,
  headingDelta,
  horizonY,
  normalize,
  project,
  unproject,
  type CameraPov,
  type Vec,
  type Viewport,
} from "@/lib/projection";

type Point = { x: number; y: number };

/** The road direction closest to where the camera looks (roads run both ways, so modulo 180°). */
export function streetAxis(streetHeadings: number[], cameraHeading: number): number | null {
  let best: number | null = null;
  for (const h of streetHeadings) {
    const candidate = Math.abs(headingDelta(cameraHeading, h)) <= 90 ? h : h + 180;
    if (best === null || Math.abs(headingDelta(cameraHeading, candidate)) < Math.abs(headingDelta(cameraHeading, best))) {
      best = candidate;
    }
  }
  return best === null ? null : ((best % 360) + 360) % 360;
}

/** A vanishing point on the eye level for a horizontal heading, whichever way it faces the camera. */
function vanishingPoint(heading: number, pov: CameraPov, view: Viewport): Point | null {
  const facing = Math.abs(headingDelta(pov.heading, heading)) <= 90 ? heading : heading + 180;
  const p = project(direction(facing, 0), pov, view);
  // Far beyond the screen, the lines are effectively parallel: nothing useful to draw.
  if (!p || Math.abs(p.x - view.width / 2) > view.width * 12) return null;
  return p;
}

/** Lines from a vanishing point through evenly spaced points around the screen edge. */
function rays(vp: Point, view: Viewport, count = 28) {
  const { width: w, height: h } = view;
  const perimeter = 2 * (w + h);
  return Array.from({ length: count }, (_, i) => {
    let d = ((i + 0.5) / count) * perimeter;
    let target: Point;
    if (d < w) target = { x: d, y: 0 };
    else if ((d -= w) < h) target = { x: w, y: d };
    else if ((d -= h) < w) target = { x: w - d, y: h };
    else target = { x: 0, y: h - (d - w) };
    const dx = target.x - vp.x;
    const dy = target.y - vp.y;
    const len = Math.hypot(dx, dy) || 1;
    const reach = (w + h) * 3;
    return { x2: vp.x + (dx / len) * reach, y2: vp.y + (dy / len) * reach };
  });
}

const ALONG = "#fbbf24";
const ACROSS = "#22d3ee";

export function PerspectiveGuides({ show, showHorizon }: { show: boolean; showHorizon: boolean }) {
  const { pov, view, streetHeadings } = useCamera();
  if (!view.width || (!show && !showHorizon)) return null;

  const eyeY = horizonY(pov, view);
  const level = Math.abs(pov.pitch) <= 1.5;
  const axis = show ? streetAxis(streetHeadings, pov.heading) : null;
  const along = axis === null ? null : vanishingPoint(axis, pov, view);
  const across = axis === null ? null : vanishingPoint(axis + 90, pov, view);

  return (
    <svg className="pointer-events-none absolute inset-0 z-[6] h-full w-full" aria-hidden>
      {along &&
        rays(along, view).map((r, i) => (
          <line key={`a${i}`} x1={along.x} y1={along.y} x2={r.x2} y2={r.y2} stroke={ALONG} strokeOpacity={0.45} strokeWidth={1} />
        ))}
      {across &&
        rays(across, view).map((r, i) => (
          <line key={`c${i}`} x1={across.x} y1={across.y} x2={r.x2} y2={r.y2} stroke={ACROSS} strokeOpacity={0.4} strokeWidth={1} />
        ))}

      <line
        x1={0}
        x2={view.width}
        y1={eyeY}
        y2={eyeY}
        stroke="#7dd3fc"
        strokeWidth={2}
        strokeDasharray={level ? undefined : "8 6"}
        style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.7))" }}
      />
      <text x={view.width - 12} y={eyeY - 8} textAnchor="end" className="fill-sky-200 text-[11px]" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)", strokeWidth: 3 }}>
        {level ? "Eye level" : "Eye level (view tilted: press L to level)"}
      </text>

      {along && <VpMarker p={along} color={ALONG} label="VP: along the street" />}
      {across && <VpMarker p={across} color={ACROSS} label="VP: across" />}
      {show && axis === null && (
        <text x={view.width / 2} y={view.height - 90} textAnchor="middle" className="fill-white text-xs" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.7)", strokeWidth: 3 }}>
          No street direction here, so only eye level is shown
        </text>
      )}
      {show && axis !== null && !across && (
        <text x={view.width / 2} y={view.height - 90} textAnchor="middle" className="fill-white text-xs" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.7)", strokeWidth: 3 }}>
          One-point perspective: edges across the street stay parallel to each other
        </text>
      )}
    </svg>
  );
}

function VpMarker({ p, color, label }: { p: Point; color: string; label: string }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={color} strokeWidth={2.5} />
      <circle cx={p.x} cy={p.y} r={2} fill={color} />
      <text x={p.x + 11} y={p.y + 18} fill={color} className="text-[11px] font-semibold" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.7)", strokeWidth: 3 }}>
        {label}
      </text>
    </g>
  );
}

// ---- Interactive tools ----

export type SceneTool = "vp" | "angle" | "proportion";

interface Segment {
  a: Vec;
  b: Vec;
}

const TOOL_INFO: Record<SceneTool, { title: string; hint: string; max: number }> = {
  vp: {
    title: "Find a vanishing point",
    hint: "Drag along two edges that are parallel in real life, like the top and bottom of a row of windows.",
    max: 2,
  },
  angle: {
    title: "Measure angles",
    hint: "Drag along any edge to read its angle against the horizontal, like holding up a pencil.",
    max: 6,
  },
  proportion: {
    title: "Compare proportions",
    hint: "Drag your unit first (say a door's height), then drag other lengths to measure them in units.",
    max: 8,
  },
};

function extend(a: Point, b: Point, reach: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x1: a.x - (dx / len) * reach, y1: a.y - (dy / len) * reach, x2: b.x + (dx / len) * reach, y2: b.y + (dy / len) * reach };
}

function screenAngle(a: Point, b: Point) {
  let deg = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}

function vanishingResult(s1: Segment, s2: Segment, pov: CameraPov) {
  const n1 = cross(s1.a, s1.b);
  const n2 = cross(s2.a, s2.b);
  const meet = cross(n1, n2);
  if (Math.hypot(...meet) < 1e-5) return { dir: null, message: "These look parallel on screen. Edges parallel to your picture plane never converge." };
  let dir: Vec = normalize(meet);
  if (dot(dir, direction(pov.heading, pov.pitch)) < 0) dir = [-dir[0], -dir[1], -dir[2]];
  const { pitch } = angles(dir);
  const message =
    Math.abs(pitch) >= 75
      ? "They meet straight up or down, so these are vertical edges. That's the third vanishing point of three-point perspective."
      : Math.abs(pitch) <= 2
        ? "They meet on the eye-level line ✓ These edges are level in real life, so their vanishing point sits on the horizon."
        : pitch > 0
          ? `They meet ${pitch.toFixed(0)}° above eye level, so the edges slope upward in real life, like a roof or an uphill street.`
          : `They meet ${Math.abs(pitch).toFixed(0)}° below eye level, so the edges slope downward, like a downhill street or a ramp.`;
  return { dir, message };
}

const labelStyle = { paintOrder: "stroke" as const, stroke: "rgba(0,0,0,0.75)", strokeWidth: 3 };

export function SceneTools({ tool, onExit }: { tool: SceneTool; onExit: () => void }) {
  const { pov, view } = useCamera();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [past, setPast] = useState<Segment[][]>([]);
  const [future, setFuture] = useState<Segment[][]>([]);
  const [draft, setDraft] = useState<Segment | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const info = TOOL_INFO[tool];

  // Every change (add, delete, clear) is undoable.
  const commit = (next: Segment[]) => {
    setPast([...past, segments]);
    setFuture([]);
    setSegments(next);
  };
  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setPast(past.slice(0, -1));
    setFuture([...future, segments]);
    setSegments(previous);
  };
  const redo = () => {
    const next = future.at(-1);
    if (!next) return;
    setFuture(future.slice(0, -1));
    setPast([...past, segments]);
    setSegments(next);
  };

  // ⌘Z / Ctrl+Z undo; ⇧⌘Z, Ctrl+Shift+Z or Ctrl+Y redo.
  const history = useRef({ undo, redo });
  useEffect(() => {
    history.current = { undo, redo };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) history.current.redo();
        else history.current.undo();
      } else if (key === "y" && e.ctrlKey) {
        e.preventDefault();
        history.current.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const undoKey = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘Z" : "Ctrl+Z";

  const at = (e: React.PointerEvent): Vec => {
    const rect = svgRef.current!.getBoundingClientRect();
    return unproject(e.clientX - rect.left, e.clientY - rect.top, pov, view);
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const d = at(e);
    setDraft({ a: d, b: d });
  };
  const onMove = (e: React.PointerEvent) => {
    if (draft) setDraft({ a: draft.a, b: at(e) });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!draft) return;
    // Take the end from the release itself: a quick flick can finish before the last move re-renders.
    const done = { a: draft.a, b: at(e) };
    const a = project(done.a, pov, view);
    const b = project(done.b, pov, view);
    if (a && b && Math.hypot(b.x - a.x, b.y - a.y) > 10) {
      if (!(tool === "proportion" && segments.length >= info.max)) commit([...segments, done].slice(-info.max));
    }
    setDraft(null);
  };

  // Segments are stored as directions, so they stay on the scene while you look around.
  const onScreen = [...segments, ...(draft ? [draft] : [])]
    .map((s) => ({ a: project(s.a, pov, view), b: project(s.b, pov, view) }))
    .map((s) => (s.a && s.b ? { a: s.a, b: s.b } : null));

  const vp = tool === "vp" && segments.length === 2 ? vanishingResult(segments[0], segments[1], pov) : null;
  const vpPoint = vp?.dir ? project(vp.dir, pov, view) : null;
  const vpOffscreen = vpPoint && (vpPoint.x < 0 || vpPoint.x > view.width || vpPoint.y < 0 || vpPoint.y > view.height);

  const unitLength = onScreen[0] ? Math.hypot(onScreen[0].b.x - onScreen[0].a.x, onScreen[0].b.y - onScreen[0].a.y) : 0;

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0 z-[7] h-full w-full cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDraft(null)}
      >
        {onScreen.map((s, i) => {
          if (!s) return null;
          const mid = { x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 };
          const color = tool === "proportion" && i === 0 ? "#fbbf24" : "#f472b6";
          let label = "";
          if (tool === "angle") {
            const deg = screenAngle(s.a, s.b);
            label = Math.abs(deg) < 0.5 ? "0°, level" : Math.abs(deg) > 89.5 ? "90°, vertical" : `${Math.abs(deg).toFixed(0)}° ${deg > 0 ? "↗" : "↘"}`;
          } else if (tool === "proportion") {
            const len = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
            label = i === 0 ? "1 unit" : `${(len / (unitLength || 1)).toFixed(1)} units`;
          }
          return (
            <g key={i}>
              {tool === "vp" && vp && <line {...extend(s.a, s.b, view.width * 4)} stroke="#f472b6" strokeOpacity={0.55} strokeDasharray="6 5" strokeWidth={1.5} />}
              {tool === "angle" && (
                <line x1={s.a.x} y1={s.a.y} x2={s.a.x + (s.b.x >= s.a.x ? 60 : -60)} y2={s.a.y} stroke="white" strokeOpacity={0.7} strokeDasharray="4 4" />
              )}
              <line x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
              <circle cx={s.a.x} cy={s.a.y} r={4} fill={color} />
              <circle cx={s.b.x} cy={s.b.y} r={4} fill={color} />
              {label && (
                <text x={mid.x + 8} y={mid.y - 8} fill="white" className="text-[13px] font-semibold" style={labelStyle}>
                  {label}
                </text>
              )}
              {!draft && i < segments.length && (
                <g
                  role="button"
                  aria-label="Delete this line"
                  className="cursor-pointer"
                  transform={`translate(${s.b.x + 14} ${s.b.y - 14})`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => commit(segments.filter((_, j) => j !== i))}
                >
                  <title>Delete this line</title>
                  <circle r={9} fill="rgba(9,9,11,0.85)" stroke="white" strokeOpacity={0.6} />
                  <path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
                </g>
              )}
            </g>
          );
        })}
        {vpPoint && !vpOffscreen && (
          <g>
            <circle cx={vpPoint.x} cy={vpPoint.y} r={9} fill="none" stroke="#f472b6" strokeWidth={3} />
            <circle cx={vpPoint.x} cy={vpPoint.y} r={2.5} fill="#f472b6" />
          </g>
        )}
      </svg>

      <div className="absolute inset-x-0 bottom-24 z-30 flex justify-center px-4">
        <div className="max-w-lg space-y-1.5 rounded-2xl bg-zinc-950/90 px-4 py-3 text-sm shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">{info.title}</span>
            <div className="flex gap-3 text-xs">
              <button
                className="text-zinc-400 hover:text-white disabled:opacity-40"
                disabled={past.length === 0}
                onClick={undo}
                title={`Undo (${undoKey})`}
              >
                Undo
              </button>
              <button
                className="text-zinc-400 hover:text-white disabled:opacity-40"
                disabled={segments.length === 0}
                onClick={() => commit([])}
              >
                Clear
              </button>
              <button className="font-semibold text-amber-300 hover:text-amber-200" onClick={onExit}>
                Done
              </button>
            </div>
          </div>
          <p className="text-zinc-300">
            {vp ? vp.message : info.hint}
            {vpOffscreen && " (The meeting point is off-screen; follow the dashed lines.)"}
          </p>
          <p className="text-xs text-zinc-500">
            {undoKey} undoes, and × deletes a single line. The view is locked while this tool is open; press Done or Esc
            to look around.
          </p>
        </div>
      </div>
    </>
  );
}
