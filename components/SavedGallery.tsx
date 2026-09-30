"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import SpotsMap from "./SpotsMap";
import SyncPanel from "./SyncPanel";
import {
  explorerUrl,
  googleMapsUrl,
  importPlaces,
  removePlace,
  savedStore,
  streetViewImageUrl,
  upsertPlace,
  type SavedPlace,
  type SketchStatus,
} from "@/lib/saved-places";

type StatusFilter = "all" | SketchStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To draw" },
  { value: "sketched", label: "Sketched" },
];

export default function SavedGallery() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const places = savedStore.useValue();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [layout, setLayout] = useState<"grid" | "map">("grid");
  const fileInput = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => [...new Set(places.flatMap((p) => p.tags))].sort(), [places]);

  const visible = places.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (tag && !p.tags.includes(tag)) return false;
    const q = query.trim().toLowerCase();
    return !q || [p.title, p.near, p.note, ...p.tags].some((s) => s.toLowerCase().includes(q));
  });

  const counts = {
    all: places.length,
    todo: places.filter((p) => p.status === "todo").length,
    sketched: places.filter((p) => p.status === "sketched").length,
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(places, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sketch-spots-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const added = importPlaces(JSON.parse(await file.text()));
      setMessage(`Imported ${added} new spot${added === 1 ? "" : "s"}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
            ← Back to exploring
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">My sketch spots</h1>
          <p className="mb-2 text-sm text-zinc-500">Saved in this browser. Export a backup or turn on sync to use them elsewhere.</p>
          <SyncPanel />
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={exportJson} disabled={places.length === 0} className={outlineButton}>
            Export
          </button>
          <button onClick={() => fileInput.current?.click()} className={outlineButton}>
            Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJson(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {message && (
        <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-400/15 dark:text-amber-200">
          {message}
        </p>
      )}

      {places.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <p className="text-lg font-medium">No spots saved yet</p>
          <p className="mt-1 text-sm text-zinc-500">Explore, and press Save (or S) when a view makes you want to draw.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950">
            Start exploring
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatus(t.value)}
                  className={`rounded-full px-3 py-1 ${
                    status === t.value ? "bg-white shadow-sm dark:bg-zinc-950" : "text-zinc-500"
                  }`}
                >
                  {t.label} <span className="text-zinc-400">{counts[t.value]}</span>
                </button>
              ))}
            </div>
            <div className="flex rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
              {(["grid", "map"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`rounded-full px-3 py-1 capitalize ${
                    layout === l ? "bg-white shadow-sm dark:bg-zinc-950" : "text-zinc-500"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, notes, places…"
              className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-zinc-700"
            />
          </div>

          {allTags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(tag === t ? null : t)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    tag === t
                      ? "border-amber-400 bg-amber-400 text-zinc-950"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {layout === "map" && apiKey ? (
            <SpotsMap places={visible} apiKey={apiKey} />
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">No spots match these filters.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <PlaceCard key={p.id} place={p} apiKey={apiKey} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

const outlineButton =
  "rounded-full border border-zinc-300 px-4 py-1.5 hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700";

function PlaceCard({ place, apiKey }: { place: SavedPlace; apiKey: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(place.note);
  const sketched = place.status === "sketched";

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <a href={explorerUrl(place)} className="relative block aspect-[40/26] bg-zinc-200 dark:bg-zinc-800">
        {apiKey && !imageFailed ? (
          // Street View Static images are served straight from Google, so next/image optimisation doesn't apply.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streetViewImageUrl(place, apiKey)}
            alt={place.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="flex h-full items-center justify-center px-4 text-center text-xs text-zinc-500">
            Preview unavailable. Enable the Street View Static API for thumbnails.
          </span>
        )}
        {sketched && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
            ✓ Sketched
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h2 className="font-medium leading-snug">{place.title}</h2>
          <p className="text-xs text-zinc-500">
            {place.near && `${place.near} · `}
            saved {new Date(place.savedAt).toLocaleDateString()}
          </p>
        </div>

        {editingNote ? (
          <textarea
            autoFocus
            value={note}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              upsertPlace({ ...place, note: note.trim() });
              setEditingNote(false);
            }}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-zinc-700"
          />
        ) : (
          <button
            onClick={() => setEditingNote(true)}
            className="text-left text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
          >
            {place.note || <span className="italic text-zinc-400">Add sketch notes…</span>}
          </button>
        )}

        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.tags.map((t) => (
              <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-sm">
          <button
            onClick={() => upsertPlace({ ...place, status: sketched ? "todo" : "sketched" })}
            className={`rounded-full px-3 py-1 font-medium ${
              sketched
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-400 text-zinc-950"
            }`}
          >
            {sketched ? "Mark to draw" : "Mark sketched"}
          </button>
          <a href={explorerUrl(place)} className="text-zinc-600 hover:text-foreground dark:text-zinc-400">
            Open
          </a>
          {apiKey && (
            <a
              href={streetViewImageUrl(place, apiKey, "640x640")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-foreground dark:text-zinc-400"
              title="Large still image to draw from"
            >
              Reference
            </a>
          )}
          <a
            href={googleMapsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-foreground dark:text-zinc-400"
          >
            Maps ↗
          </a>
          <button
            onClick={() => removePlace(place.id)}
            className="ml-auto text-zinc-400 hover:text-red-500"
            aria-label={`Delete ${place.title}`}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
