"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { findRecipes, matchLabel, type Recipe } from "@/lib/mixing";
import { CATALOG, WATER, addPaint, mixablePaints, paletteStore, rememberPick } from "@/lib/paints";

// Chrome and Edge can sample any pixel on screen, including the Street View
// image (which the page itself isn't allowed to read).
interface EyeDropperResult {
  sRGBHex: string;
}
declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<EyeDropperResult> };
  }
}

type Mode = "mine" | "best";

export default function ColorMixer({ warning, onClose }: { warning?: string; onClose: () => void }) {
  const palette = paletteStore.useValue();
  const [target, setTarget] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("mine");
  const [picking, setPicking] = useState(false);
  const hasEyeDropper = typeof window !== "undefined" && !!window.EyeDropper;

  const choose = (hex: string) => {
    const h = hex.toLowerCase();
    setTarget(h);
    rememberPick(h);
  };

  const pickFromScreen = async () => {
    if (!window.EyeDropper) return;
    setPicking(true);
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      choose(sRGBHex);
    } catch {
      // Cancelled with Escape.
    } finally {
      setPicking(false);
    }
  };

  const ownedIds = useMemo(() => new Set(palette.paints.map((p) => p.id)), [palette.paints]);

  const recipes = useMemo(() => {
    if (!target) return [];
    const pool = mode === "mine" ? palette.paints : CATALOG;
    return findRecipes(target, mixablePaints(pool, palette.medium));
  }, [target, mode, palette.paints, palette.medium]);

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col overflow-hidden bg-zinc-950/90 text-zinc-100 shadow-2xl backdrop-blur-md sm:inset-y-auto sm:top-0 sm:m-3 sm:max-h-[calc(100%-1.5rem)] sm:rounded-2xl">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-semibold">Color mixer</h2>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/paints" className="text-zinc-400 hover:text-white">
            My paints ({palette.paints.length})
          </Link>
          <button aria-label="Close color mixer" className="px-2 text-xl leading-none text-zinc-400 hover:text-white" onClick={onClose}>
            ×
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm">
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <label
              className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/20"
              style={{ background: target ?? "repeating-conic-gradient(#3f3f46 0 25%, #27272a 0 50%) 0 0 / 12px 12px" }}
              title="Choose a color"
            >
              <input
                type="color"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={target ?? "#808080"}
                onChange={(e) => choose(e.target.value)}
              />
            </label>
            <div className="min-w-0 flex-1 space-y-1.5">
              {hasEyeDropper ? (
                <button
                  onClick={pickFromScreen}
                  disabled={picking}
                  className="w-full rounded-full bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  {picking ? "Click anywhere on the view…" : "Pick a color from the view"}
                </button>
              ) : (
                <p className="text-xs text-zinc-400">
                  Click the swatch to choose a color. On a Mac, the color window has a magnifier for picking from the
                  screen. (Chrome and Edge can pick directly from the view.)
                </p>
              )}
              {target && <p className="font-mono text-xs text-zinc-400">{target.toUpperCase()}</p>}
            </div>
          </div>
          {warning && <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{warning}</p>}
          {palette.recent.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-xs text-zinc-500">Recent</span>
              {palette.recent.map((hex) => (
                <button
                  key={hex}
                  onClick={() => setTarget(hex)}
                  title={hex}
                  aria-label={`Use ${hex}`}
                  className={`h-6 w-6 rounded-md ring-1 ${hex === target ? "ring-2 ring-amber-400" : "ring-white/20"}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          )}
        </section>

        <div className="flex rounded-full bg-white/5 p-1 text-xs">
          {(
            [
              ["mine", "Mix from my paints"],
              ["best", "Best paints for this"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-full px-3 py-1.5 ${mode === value ? "bg-white text-zinc-950" : "text-zinc-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {!target ? (
          <p className="text-zinc-400">Pick a color to see how to mix it.</p>
        ) : mode === "mine" && palette.paints.length === 0 ? (
          <div className="space-y-2 text-zinc-300">
            <p>Add the paints you own and I&apos;ll work out mixes from them.</p>
            <Link href="/paints" className="inline-block rounded-full bg-amber-400 px-4 py-1.5 font-semibold text-zinc-950">
              Add my paints
            </Link>
            <p className="text-xs text-zinc-500">Or switch to “Best paints for this” to see what would mix it.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recipes.map((r, i) => (
              <RecipeCard key={i} recipe={r} target={target} ownedIds={mode === "best" ? ownedIds : undefined} />
            ))}
          </ul>
        )}

        <p className="text-xs text-zinc-500">
          Mixes are simulated with the Kubelka–Munk paint model ({palette.medium === "watercolor" ? "watercolor" : "opaque paint"}
          ). Treat them as a starting point: real paints vary by brand, and screens differ.
        </p>
      </div>
    </aside>
  );
}

function RecipeCard({ recipe, target, ownedIds }: { recipe: Recipe; target: string; ownedIds?: Set<string> }) {
  const match = matchLabel(recipe.distance);
  const water = recipe.parts.find((p) => p.paint.id === WATER.id);
  const pigments = recipe.parts.filter((p) => p !== water).sort((a, b) => b.parts - a.parts);

  return (
    <li className="rounded-xl border border-white/10 p-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex overflow-hidden rounded-lg ring-1 ring-white/20" title="Your color · the mix">
          <span className="h-9 w-9" style={{ background: target }} />
          <span className="h-9 w-9" style={{ background: recipe.hex }} />
        </div>
        <span
          className={`text-xs font-medium ${
            match.tone === "good" ? "text-emerald-300" : match.tone === "ok" ? "text-amber-300" : "text-red-300"
          }`}
        >
          {match.label}
        </span>
      </div>
      <ul className="space-y-1">
        {pigments.map(({ paint, parts }) => (
          <li key={paint.id} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/30" style={{ background: paint.hex }} />
            <span className="flex-1">
              <span className="text-zinc-400">
                {parts} part{parts > 1 ? "s" : ""}
              </span>{" "}
              {paint.name}
            </span>
            {ownedIds &&
              (ownedIds.has(paint.id) ? (
                <span className="text-xs text-emerald-300">✓ have it</span>
              ) : (
                <button onClick={() => addPaint(paint)} className="text-xs text-amber-300 hover:underline">
                  + I have this
                </button>
              ))}
          </li>
        ))}
        {water && (
          <li className="flex items-center gap-2 text-zinc-400">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/30" />
            Thin with {water.parts} part{water.parts > 1 ? "s" : ""} water
          </li>
        )}
      </ul>
    </li>
  );
}
