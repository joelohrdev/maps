"use client";

import { FRAME_OPTIONS, TONE_OPTIONS, aidsStore, type DrawingAids } from "@/lib/drawing-aids";

/** Pitch (degrees) within which the view counts as level, so the eye-level line is accurate. */
const LEVEL_TOLERANCE = 1.5;

/** SVG filters referenced by the value-study tones; render once near the panorama. */
export function ToneFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      {TONE_OPTIONS.filter((t) => t.levels).map((t) => (
        <filter key={t.value} id={`tone-${t.value}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={t.levels} />
            <feFuncG type="discrete" tableValues={t.levels} />
            <feFuncB type="discrete" tableValues={t.levels} />
          </feComponentTransfer>
        </filter>
      ))}
    </svg>
  );
}

const guideLine = "absolute bg-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]";

export function DrawingOverlay({ aids, pitch }: { aids: DrawingAids; pitch: number }) {
  const ratio = FRAME_OPTIONS.find((f) => f.value === aids.frame)?.ratio ?? 0;
  const level = Math.abs(pitch) <= LEVEL_TOLERANCE;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden">
      <div
        className="relative"
        style={
          ratio
            ? {
                aspectRatio: ratio,
                width: `min(92%, calc(80dvh * ${ratio}))`,
                boxShadow: "0 0 0 200vmax rgba(0,0,0,0.55)",
                outline: "1px solid rgba(255,255,255,0.8)",
              }
            : { width: "100%", height: "100%" }
        }
      >
        {aids.grid &&
          [1, 2].map((i) => (
            <div key={i}>
              <div className={`${guideLine} inset-y-0 w-px`} style={{ left: `${(i * 100) / 3}%` }} />
              <div className={`${guideLine} inset-x-0 h-px`} style={{ top: `${(i * 100) / 3}%` }} />
            </div>
          ))}
      </div>

      {aids.horizon && (
        <div className="absolute inset-x-0 top-1/2">
          <div
            className={`h-0 border-t-2 ${level ? "border-sky-300" : "border-dashed border-sky-300/50"}`}
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6))" }}
          />
          <span className="absolute right-3 -translate-y-full rounded bg-zinc-950/70 px-1.5 py-0.5 text-[11px] text-sky-200">
            {level ? "Eye level" : "Press L to level the view"}
          </span>
        </div>
      )}
    </div>
  );
}

export function AidsPanel({ onLevel, onClose }: { onLevel: () => void; onClose: () => void }) {
  const aids = aidsStore.useValue();
  const update = (patch: Partial<DrawingAids>) => aidsStore.set((a) => ({ ...a, ...patch }));

  return (
    <div className="pointer-events-auto w-72 space-y-4 rounded-2xl bg-zinc-950/90 p-4 text-sm shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Drawing aids</h2>
        <button aria-label="Close drawing aids" className="text-xl leading-none text-zinc-400 hover:text-white" onClick={onClose}>
          ×
        </button>
      </div>

      <Choice
        label="Crop to your page"
        options={FRAME_OPTIONS}
        value={aids.frame}
        onChange={(frame) => update({ frame })}
      />

      <div className="space-y-2">
        <Check label="Rule-of-thirds grid" checked={aids.grid} onChange={(grid) => update({ grid })} />
        <Check label="Eye-level line" checked={aids.horizon} onChange={(horizon) => update({ horizon })} />
        <button
          onClick={onLevel}
          className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-left hover:border-white/40"
          title="Level the view (L)"
        >
          Level the view <span className="text-zinc-400">(L): verticals stay vertical</span>
        </button>
      </div>

      <Choice label="Values" options={TONE_OPTIONS} value={aids.tone} onChange={(tone) => update({ tone })} />
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              value === o.value ? "border-amber-400 bg-amber-400 text-zinc-950" : "border-white/15 text-zinc-300 hover:border-white/40"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" className="accent-amber-400" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
