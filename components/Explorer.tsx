"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AidsPanel, DrawingOverlay, ToneFilters } from "./DrawingAids";
import FiltersPanel from "./FiltersPanel";
import PlaceSearch from "./PlaceSearch";
import SaveDialog from "./SaveDialog";
import { aidsStore, toneFilter } from "@/lib/drawing-aids";
import { filtersStore, type Anchor } from "@/lib/filters";
import { findRandomPanorama, loadGoogleMaps, panoramaSources } from "@/lib/google-maps";
import { nearestCity } from "@/lib/places";
import { explorerUrl, googleMapsUrl, savedStore, type SavedPlace } from "@/lib/saved-places";
import { THEME_OPTIONS } from "@/lib/themes";

interface View {
  panoId: string;
  lat: number;
  lng: number;
  description: string;
}

interface Pov {
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
}

export default function Explorer() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return <MissingKey />;
  return <StreetExplorer apiKey={apiKey} />;
}

function nearLabel(lat: number, lng: number) {
  const near = nearestCity(lat, lng);
  if (!near || near.km > 150) return "";
  return `near ${near.city}, ${near.country.name}`;
}

function StreetExplorer({ apiKey }: { apiKey: string }) {
  const searchParams = useSearchParams();
  const filters = filtersStore.useValue();
  const saved = savedStore.useValue();
  const aids = aidsStore.useValue();

  const panoEl = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const serviceRef = useRef<google.maps.StreetViewService | null>(null);
  const searchingRef = useRef(false);
  const seen = useRef(new Set<string>());
  const handledLink = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [back, setBack] = useState<Pov[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<{ place: SavedPlace; isExisting: boolean } | null>(null);
  const [touring, setTouring] = useState(false);
  const [popover, setPopover] = useState<"aids" | "search" | null>(null);
  const [pitch, setPitch] = useState(0);

  const currentPov = (): Pov | null => {
    const pano = panoRef.current;
    const panoId = pano?.getPano();
    if (!pano || !panoId) return null;
    const { heading, pitch } = pano.getPov();
    return { panoId, heading, pitch, zoom: pano.getZoom() ?? 0 };
  };

  const rememberCurrent = () => {
    const pov = currentPov();
    if (pov) setBack((b) => [...b.slice(-49), pov]);
  };

  const showPano = (pov: Pov) => {
    const pano = panoRef.current;
    if (!pano) return;
    pano.setPano(pov.panoId);
    pano.setPov({ heading: pov.heading, pitch: pov.pitch });
    pano.setZoom(pov.zoom);
    pano.setVisible(true);
  };

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  };

  // Set up the panorama, minimap and Street View service once.
  useEffect(() => {
    let cancelled = false;
    window.gm_authFailure = () =>
      setError("Google rejected the API key. Check that the Maps JavaScript API is enabled and the key allows this site.");

    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        const [{ StreetViewPanorama, StreetViewService }, { Map: GoogleMap }, { AdvancedMarkerElement }] =
          await Promise.all([
            google.maps.importLibrary("streetView") as Promise<google.maps.StreetViewLibrary>,
            google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
            google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          ]);
        if (cancelled || !panoEl.current || !mapEl.current) return;

        const pano = new StreetViewPanorama(panoEl.current, {
          addressControl: false,
          fullscreenControl: false,
          enableCloseButton: false,
          motionTracking: false,
          motionTrackingControl: false,
          showRoadLabels: !filtersStore.get().stealth,
          visible: false,
        });
        const service = new StreetViewService();
        const map = new GoogleMap(mapEl.current, {
          center: { lat: 0, lng: 0 },
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        const marker = new AdvancedMarkerElement({ map });

        const sync = () => {
          const pos = pano.getPosition();
          const panoId = pano.getPano();
          if (!pos || !panoId) return;
          seen.current.add(panoId);
          setView({ panoId, lat: pos.lat(), lng: pos.lng(), description: pano.getLocation()?.description ?? "" });
          map.panTo(pos);
          marker.position = pos;
        };
        pano.addListener("pano_changed", sync);
        pano.addListener("position_changed", sync);
        pano.addListener("pov_changed", () => setPitch(Math.round(pano.getPov().pitch * 2) / 2));

        // Clicking the minimap jumps to the nearest Street View there.
        map.addListener("click", async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          try {
            const { data } = await service.getPanorama({
              location: e.latLng,
              radius: 300,
              sources: panoramaSources(filtersStore.get()),
            });
            if (data.location?.pano) {
              rememberCurrent();
              pano.setPano(data.location.pano);
            }
          } catch {
            flash("No Street View right there. Try clicking on a road.");
          }
        });

        panoRef.current = pano;
        serviceRef.current = service;
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't start Google Maps.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time setup; helpers only touch refs and setters
  }, [apiKey]);

  const go = useCallback(async () => {
    const service = serviceRef.current;
    if (!service || searchingRef.current) return;
    searchingRef.current = true;
    setSearching(true);
    setError(null);
    try {
      const found = await findRandomPanorama(service, filtersStore.get(), seen.current);
      rememberCurrent();
      showPano({ panoId: found.panoId, heading: Math.random() * 360, pitch: 0, zoom: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong finding a spot.");
    } finally {
      searchingRef.current = false;
      setSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers only touch refs and setters
  }, []);

  const levelView = () => {
    const pano = panoRef.current;
    if (pano) pano.setPov({ heading: pano.getPov().heading, pitch: 0 });
  };

  // Jump to the nearest Street View at a searched place and keep Go exploring around it.
  const pickPlace = async (anchor: Anchor) => {
    filtersStore.set((f) => ({ ...f, anchor }));
    setPopover(null);
    const service = serviceRef.current;
    if (!service) return;
    try {
      const { data } = await service.getPanorama({
        location: anchor,
        radius: 2000,
        preference: "nearest" as google.maps.StreetViewPreference,
        sources: panoramaSources(filtersStore.get()),
      });
      if (!data.location?.pano) throw new Error("no pano");
      rememberCurrent();
      showPano({ panoId: data.location.pano, heading: Math.random() * 360, pitch: 0, zoom: 0 });
    } catch {
      go();
    }
  };

  const goBack = () => {
    const prev = back.at(-1);
    if (!prev) return;
    setBack((b) => b.slice(0, -1));
    showPano(prev);
  };

  // Open a shared/saved link (?pano=…&h=…&p=…&z=…), otherwise start somewhere random.
  useEffect(() => {
    if (!ready) return;
    const key = searchParams.toString();
    if (handledLink.current === key) return;
    handledLink.current = key;
    const panoId = searchParams.get("pano");
    if (panoId) {
      const num = (k: string) => Number(searchParams.get(k)) || 0;
      showPano({ panoId, heading: num("h"), pitch: num("p"), zoom: num("z") });
    } else if (!panoRef.current?.getPano()) {
      go();
    }
  }, [ready, searchParams, go]);

  useEffect(() => {
    panoRef.current?.setOptions({ showRoadLabels: !filters.stealth });
  }, [ready, filters.stealth]);

  // Tour mode: jump to a new spot every few seconds. Walking around restarts the timer.
  useEffect(() => {
    if (!touring || !ready || searching || editing || showFilters || popover === "search") return;
    const timer = setTimeout(go, filters.tourSeconds * 1000);
    return () => clearTimeout(timer);
  }, [touring, ready, searching, editing, showFilters, popover, view?.panoId, filters.tourSeconds, go]);

  const savedHere = view ? saved.find((p) => p.panoId === view.panoId) : undefined;

  const openSave = () => {
    const pov = currentPov();
    if (!pov || !view) return;
    const near = nearLabel(view.lat, view.lng);
    const place: SavedPlace = savedHere
      ? { ...savedHere, heading: pov.heading, pitch: pov.pitch, zoom: pov.zoom }
      : {
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          panoId: pov.panoId,
          lat: view.lat,
          lng: view.lng,
          heading: pov.heading,
          pitch: pov.pitch,
          zoom: pov.zoom,
          title: view.description || (near ? near.replace(/^near/, "Near") : "Untitled spot"),
          near,
          note: "",
          tags: [],
          status: "todo",
          savedAt: new Date().toISOString(),
        };
    setEditing({ place, isExisting: !!savedHere });
  };

  const copyLink = async () => {
    const pov = currentPov();
    if (!pov) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${explorerUrl(pov)}`);
      flash("Link copied");
    } catch {
      flash("Couldn't copy the link");
    }
  };

  // Keyboard shortcuts: N next, B back, S save, F filters, T tour, G drawing aids, L level view.
  const keyActions = useRef<Record<string, () => void>>({});
  useEffect(() => {
    keyActions.current = {
      n: go,
      b: goBack,
      s: openSave,
      f: () => setShowFilters((v) => !v),
      t: () => setTouring((v) => !v),
      l: levelView,
      g: () => setPopover((p) => (p === "aids" ? null : "aids")),
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, form")) return;
      const action = keyActions.current[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault(); // otherwise the key also lands in whichever input the action focuses
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stealth = filters.stealth;
  const near = view ? nearLabel(view.lat, view.lng) : "";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-900 text-white">
      <ToneFilters />
      <div ref={panoEl} className="absolute inset-0" style={{ filter: toneFilter(aids.tone) }} />
      {view && <DrawingOverlay aids={aids} pitch={pitch} />}

      {!view && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
          {ready ? "Finding a spot to sketch…" : "Loading Street View…"}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-start gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pointer-events-auto rounded-full bg-zinc-950/75 px-3 py-2 text-sm font-semibold tracking-tight backdrop-blur">
            ✎ Sketch Atlas
          </span>
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <button
              onClick={go}
              disabled={!ready || searching}
              title="New random spot (N)"
              className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-amber-300 disabled:opacity-60"
            >
              {searching ? "Searching…" : "Go ▸"}
            </button>
            <ToolButton onClick={goBack} disabled={back.length === 0} title="Previous spot (B)">
              ◂ Back
            </ToolButton>
            <ToolButton onClick={openSave} disabled={!view} title="Save this spot (S)" active={!!savedHere}>
              {savedHere ? "★ Saved" : "☆ Save"}
            </ToolButton>
            <ToolButton onClick={() => setTouring((v) => !v)} title="Tour: auto-advance (T)" active={touring}>
              {touring ? "❚❚ Tour" : "▶ Tour"}
            </ToolButton>
            <ToolButton
              onClick={() => setPopover((p) => (p === "search" ? null : "search"))}
              title="Go to a place"
              active={popover === "search"}
            >
              Search
            </ToolButton>
            <ToolButton
              onClick={() => setPopover((p) => (p === "aids" ? null : "aids"))}
              title="Drawing aids: frame, grid, values (G)"
              active={popover === "aids"}
            >
              Guides
            </ToolButton>
            <ToolButton onClick={() => setShowFilters((v) => !v)} title="Filters (F)" active={showFilters}>
              Filters
            </ToolButton>
            <ToolButton onClick={copyLink} disabled={!view} title="Copy a link to this exact view">
              Share
            </ToolButton>
            <Link
              href="/saved"
              className="rounded-full bg-zinc-950/75 px-4 py-2 text-sm backdrop-blur hover:bg-zinc-800/90"
            >
              My spots{saved.length > 0 && <span className="ml-1.5 text-amber-300">{saved.length}</span>}
            </Link>
          </div>
        </div>

        {(filters.anchor || filters.theme !== "any") && (
          <div className="pointer-events-auto flex flex-wrap gap-2 text-xs">
            {filters.anchor ? (
              <Chip onClear={() => filtersStore.set((f) => ({ ...f, anchor: null }))}>
                Exploring around {filters.anchor.label.split(",")[0]}
              </Chip>
            ) : (
              <Chip onClear={() => filtersStore.set((f) => ({ ...f, theme: "any" }))}>
                Theme: {THEME_OPTIONS.find((t) => t.value === filters.theme)?.label}
              </Chip>
            )}
          </div>
        )}

        {popover === "search" && <PlaceSearch onPick={pickPlace} onClose={() => setPopover(null)} />}
        {popover === "aids" && <AidsPanel onLevel={levelView} onClose={() => setPopover(null)} />}
      </div>

      <div className={`absolute bottom-8 left-3 z-10 w-64 space-y-2 ${stealth ? "invisible" : ""}`}>
        {view && (
          <div className="rounded-xl bg-zinc-950/75 px-3 py-2 text-sm backdrop-blur">
            {view.description && <p className="font-medium leading-snug">{view.description}</p>}
            {near && <p className="text-xs text-zinc-300">{near}</p>}
            <button
              onClick={() => {
                const pov = currentPov();
                const url = googleMapsUrl({ ...view, heading: pov?.heading ?? 0, pitch: pov?.pitch ?? 0 });
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="text-xs text-amber-300 hover:underline"
            >
              Open in Google Maps ↗
            </button>
          </div>
        )}
        <div
          ref={mapEl}
          className="h-40 w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-white/20"
          title="Click the map to jump there"
        />
      </div>

      {(error || notice) && (
        <div className="absolute inset-x-0 bottom-20 z-30 flex justify-center px-4">
          <div
            role="status"
            className={`flex max-w-md items-start gap-3 rounded-xl px-4 py-2.5 text-sm shadow-xl ${
              error ? "bg-red-950/90 text-red-100" : "bg-zinc-950/85"
            }`}
          >
            <span>{error ?? notice}</span>
            {error && (
              <button aria-label="Dismiss" className="text-red-300 hover:text-white" onClick={() => setError(null)}>
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {showFilters && <FiltersPanel onClose={() => setShowFilters(false)} />}
      {editing && <SaveDialog {...editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ToolButton({
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-full px-4 py-2 text-sm backdrop-blur disabled:opacity-40 ${
        active ? "bg-white text-zinc-950" : "bg-zinc-950/75 hover:bg-zinc-800/90"
      }`}
    />
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-amber-400 py-1 pl-3 pr-1.5 font-medium text-zinc-950 shadow">
      {children}
      <button aria-label="Clear" onClick={onClear} className="rounded-full px-1 hover:bg-black/10">
        ×
      </button>
    </span>
  );
}

function MissingKey() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">✎ Sketch Atlas needs a Google Maps key</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Street View imagery comes from Google, so the app needs your own API key. Google&apos;s monthly free
        credit covers casual use.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
        <li>
          In the{" "}
          <a className="underline" href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer">
            Google Cloud console
          </a>
          , enable the <strong>Maps JavaScript API</strong> and the <strong>Street View Static API</strong> (used for
          thumbnails of your saved spots).
        </li>
        <li>Create an API key and restrict it to your site (for example http://localhost:3000/*).</li>
        <li>
          Add it to <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> in the project folder:
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm text-zinc-100">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
          </pre>
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </main>
  );
}
