"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOG, addPaint, paletteStore, removePaint, setMedium, updatePaint, type Medium } from "@/lib/paints";

const MEDIUMS: { value: Medium; label: string; hint: string }[] = [
  { value: "watercolor", label: "Watercolor", hint: "Lighten with water; white paint isn't used" },
  { value: "opaque", label: "Gouache, acrylic or oil", hint: "Lighten with white paint" },
];

const card = "rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800";

export default function PaintsManager() {
  const palette = paletteStore.useValue();
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#6b8e23");
  const owned = new Set(palette.paints.map((p) => p.id));
  const available = CATALOG.filter((p) => !owned.has(p.id));

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addPaint({ id: `custom-${Date.now().toString(36)}`, name: trimmed, hex });
    setName("");
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
          ← Back to exploring
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">My paints</h1>
        <p className="text-sm text-zinc-500">
          The color mixer works out recipes from these. Saved in this browser, and synced if you&apos;re signed in
          on My spots.
        </p>
      </header>

      <section className={card}>
        <h2 className="mb-3 font-semibold">What do you paint with?</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {MEDIUMS.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                palette.medium === m.value
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-400/10"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <input
                type="radio"
                name="medium"
                className="mt-1 accent-amber-500"
                checked={palette.medium === m.value}
                onChange={() => setMedium(m.value)}
              />
              <span>
                <span className="block font-medium">{m.label}</span>
                <span className="block text-xs text-zinc-500">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Your palette ({palette.paints.length})</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Click a swatch to fine-tune its color. For the best results, paint a swatch of each color, photograph it in
          daylight, and match the color to the photo.
        </p>
        {palette.paints.length === 0 ? (
          <p className="text-sm text-zinc-500">No paints yet. Add some from the list below.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {palette.paints.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: p.hex }}>
                  <input
                    type="color"
                    value={p.hex}
                    onChange={(e) => updatePaint(p.id, { hex: e.target.value })}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={`Color of ${p.name}`}
                  />
                </label>
                <input
                  value={p.name}
                  onChange={(e) => updatePaint(p.id, { name: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none focus:underline"
                  aria-label="Paint name"
                />
                {p.pigment && <span className="text-xs text-zinc-400">{p.pigment}</span>}
                <button
                  onClick={() => removePaint(p.id)}
                  className="text-zinc-400 hover:text-red-500"
                  aria-label={`Remove ${p.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Add a common paint</h2>
        <div className="flex flex-wrap gap-2">
          {available.map((p) => (
            <button
              key={p.id}
              onClick={() => addPaint(p)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <span className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: p.hex }} />
              {p.name}
            </button>
          ))}
          {available.length === 0 && <p className="text-sm text-zinc-500">You&apos;ve added all of them.</p>}
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Add your own</h2>
        <form onSubmit={addCustom} className="flex flex-wrap items-center gap-2">
          <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: hex }}>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Paint color"
            />
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Paint name, e.g. Daniel Smith Moonglow"
            className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-zinc-700"
          />
          <button className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-zinc-950">Add</button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Mixed or granulating paints (like Moonglow) are approximated as a single color.
        </p>
      </section>
    </main>
  );
}
