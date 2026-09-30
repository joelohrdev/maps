"use client";

import { useMemo, useState } from "react";
import type { Anchor } from "@/lib/filters";
import { COUNTRIES } from "@/lib/places";
import { THEME_SPOTS } from "@/lib/themes";

interface Suggestion extends Anchor {
  detail: string;
}

const NAME_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

// Every city and themed spot the app already knows, searchable without any API calls.
const KNOWN_PLACES: Suggestion[] = [
  ...COUNTRIES.flatMap((c) => c.cities.map(([label, lat, lng]) => ({ label, lat, lng, detail: c.name }))),
  ...Object.values(THEME_SPOTS)
    .flat()
    .map(([label, lat, lng, code]) => ({ label, lat, lng, detail: NAME_BY_CODE[code] ?? "" })),
].filter((p, i, all) => all.findIndex((q) => q.label === p.label) === i);

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function PlaceSearch({ onPick, onClose }: { onPick: (place: Anchor) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Suggestion[] | null>(null);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return KNOWN_PLACES.filter((p) => normalize(`${p.label} ${p.detail}`).includes(q)).slice(0, 8);
  }, [query]);

  const searchGoogle = async () => {
    const address = query.trim();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
      const { results } = await new Geocoder().geocode({ address });
      setResults(
        results.slice(0, 5).map((r) => ({
          label: r.formatted_address,
          detail: "",
          lat: r.geometry.location.lat(),
          lng: r.geometry.location.lng(),
        })),
      );
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(
        code === "REQUEST_DENIED"
          ? "Address search needs the Geocoding API. Enable it for your key in the Google Cloud console."
          : code === "ZERO_RESULTS"
            ? "Google couldn't find that place."
            : "Search failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const list = results ?? matches;

  return (
    <div className="pointer-events-auto w-80 max-w-[calc(100vw-1.5rem)] space-y-2 rounded-2xl bg-zinc-950/90 p-3 text-sm shadow-2xl backdrop-blur-md">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (matches[0] && !results) onPick(matches[0]);
          else searchGoogle();
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResults(null);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="City, neighborhood or address"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 outline-none focus:border-amber-400"
        />
        <button type="button" aria-label="Close search" onClick={onClose} className="px-1 text-xl text-zinc-400 hover:text-white">
          ×
        </button>
      </form>

      {list.length > 0 && (
        <ul className="max-h-72 overflow-y-auto">
          {list.map((p) => (
            <li key={`${p.label}-${p.lat}`}>
              <button
                onClick={() => onPick(p)}
                className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/10"
              >
                {p.label}
                {p.detail && <span className="text-zinc-400"> · {p.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !results && (
        <button
          onClick={searchGoogle}
          disabled={busy}
          className="w-full rounded-lg px-2 py-1.5 text-left text-amber-300 hover:bg-white/10 disabled:opacity-60"
        >
          {busy ? "Searching…" : `Search Google for “${query.trim()}”`}
        </button>
      )}
      {error && <p className="px-2 text-xs text-red-300">{error}</p>}
      <p className="px-2 text-xs text-zinc-500">Go will keep finding random spots around the place you pick.</p>
    </div>
  );
}
