"use client";

import { useState } from "react";
import { AREA_OPTIONS, DEFAULT_FILTERS, TOUR_OPTIONS, filtersStore, type Filters } from "@/lib/filters";
import { ALL_COUNTRY_CODES, CONTINENTS, COUNTRIES } from "@/lib/places";
import { THEME_OPTIONS } from "@/lib/themes";

const formatSeconds = (s: number) => (s < 60 ? `${s}s` : `${s / 60} min`);

export default function FiltersPanel({ onClose }: { onClose: () => void }) {
  const filters = filtersStore.useValue();
  const [open, setOpen] = useState<string | null>(null);
  const update = (patch: Partial<Filters>) => filtersStore.set((f) => ({ ...f, ...patch }));
  const selected = new Set(filters.countries);

  const setCountries = (codes: string[], on: boolean) => {
    const next = new Set(selected);
    codes.forEach((c) => (on ? next.add(c) : next.delete(c)));
    update({ countries: ALL_COUNTRY_CODES.filter((c) => next.has(c)) });
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col overflow-hidden bg-zinc-950/90 text-zinc-100 shadow-2xl backdrop-blur-md sm:m-3 sm:rounded-2xl sm:inset-y-auto sm:top-0 sm:max-h-[calc(100%-1.5rem)]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-semibold">Filters</h2>
        <div className="flex items-center gap-3 text-sm">
          <button className="text-zinc-400 hover:text-white" onClick={() => filtersStore.set(DEFAULT_FILTERS)}>
            Reset
          </button>
          <button aria-label="Close filters" className="rounded-full px-2 text-xl leading-none text-zinc-400 hover:text-white" onClick={onClose}>
            ×
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm">
        {filters.anchor && (
          <div className="flex items-start justify-between gap-3 rounded-xl bg-amber-400/10 px-3 py-2.5 text-amber-100">
            <span>
              Exploring around <strong>{filters.anchor.label}</strong>. Countries and themes are ignored until you clear
              it.
            </span>
            <button className="shrink-0 text-amber-300 hover:text-white" onClick={() => update({ anchor: null })}>
              Clear
            </button>
          </div>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Theme</h3>
          <div className="flex flex-wrap gap-1.5">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => update({ theme: t.value })}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  filters.theme === t.value
                    ? "border-amber-400 bg-amber-400 text-zinc-950"
                    : "border-white/15 text-zinc-300 hover:border-white/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {filters.theme !== "any" && (
            <p className="mt-2 text-xs text-zinc-400">
              Spots land within a few hundred meters of hand-picked places, in the countries selected below.
            </p>
          )}
        </section>

        <section className={filters.theme !== "any" && !filters.anchor ? "opacity-50" : ""}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Area</h3>
          <div className="grid gap-2">
            {AREA_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                  filters.area === o.value ? "border-amber-400 bg-amber-400/10" : "border-white/10 hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="area"
                  className="mt-1 accent-amber-400"
                  checked={filters.area === o.value}
                  onChange={() => update({ area: o.value })}
                />
                <span>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs text-zinc-400">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Options</h3>
          <Toggle
            label="Official outdoor imagery only"
            hint="Turn off to include indoor spaces and visitor photospheres (cafés, churches, museums)."
            checked={filters.officialOnly}
            onChange={(v) => update({ officialOnly: v })}
          />
          <Toggle
            label="Stealth mode"
            hint="Hide the address, minimap and road labels. Just draw what you see."
            checked={filters.stealth}
            onChange={(v) => update({ stealth: v })}
          />
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-medium">Tour speed</span>
              <span className="block text-xs text-zinc-400">How long each spot stays up in tour mode.</span>
            </span>
            <select
              className="rounded-lg border border-white/15 bg-zinc-900 px-2 py-1.5"
              value={filters.tourSeconds}
              onChange={(e) => update({ tourSeconds: Number(e.target.value) })}
            >
              {TOUR_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {formatSeconds(s)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Countries <span className="normal-case tracking-normal">({selected.size}/{COUNTRIES.length})</span>
            </h3>
            <div className="flex gap-3 text-xs">
              <button className="text-zinc-400 hover:text-white" onClick={() => setCountries(ALL_COUNTRY_CODES, true)}>
                All
              </button>
              <button className="text-zinc-400 hover:text-white" onClick={() => setCountries(ALL_COUNTRY_CODES, false)}>
                None
              </button>
            </div>
          </div>
          <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
            {CONTINENTS.map((continent) => {
              const countries = COUNTRIES.filter((c) => c.continent === continent);
              const codes = countries.map((c) => c.code);
              const count = codes.filter((c) => selected.has(c)).length;
              const expanded = open === continent;
              return (
                <li key={continent}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="accent-amber-400"
                      checked={count === codes.length}
                      ref={(el) => {
                        if (el) el.indeterminate = count > 0 && count < codes.length;
                      }}
                      onChange={(e) => setCountries(codes, e.target.checked)}
                      aria-label={`All of ${continent}`}
                    />
                    <button
                      className="flex flex-1 items-center justify-between text-left"
                      onClick={() => setOpen(expanded ? null : continent)}
                      aria-expanded={expanded}
                    >
                      <span className="font-medium">{continent}</span>
                      <span className="text-xs text-zinc-400">
                        {count}/{codes.length} {expanded ? "▴" : "▾"}
                      </span>
                    </button>
                  </div>
                  {expanded && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 pb-3 pl-9">
                      {countries.map((c) => (
                        <label key={c.code} className="flex cursor-pointer items-center gap-2 text-zinc-300">
                          <input
                            type="checkbox"
                            className="accent-amber-400"
                            checked={selected.has(c.code)}
                            onChange={(e) => setCountries([c.code], e.target.checked)}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-zinc-400">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
