"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { explorerUrl, type SavedPlace } from "@/lib/saved-places";

const COLORS = {
  todo: { background: "#fbbf24", borderColor: "#b45309", glyphColor: "#78350f" },
  sketched: { background: "#10b981", borderColor: "#047857", glyphColor: "#ecfdf5" },
};

/** World map of saved spots: amber = still to draw, green = sketched. */
export default function SpotsMap({ places, apiKey }: { places: SavedPlace[]; apiKey: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        const { Map: GoogleMap } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (cancelled || !el.current) return;
        mapRef.current = new GoogleMap(el.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load the map.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const info = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    const markers = places.map((p) => {
      const pin = new google.maps.marker.PinElement({ ...COLORS[p.status], glyphText: p.status === "sketched" ? "✓" : "" });
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: p.lat, lng: p.lng },
        content: pin,
        title: p.title,
        gmpClickable: true,
      });
      marker.addEventListener("gmp-click", () => {
        const content = document.createElement("div");
        content.className = "text-sm text-zinc-900";
        const title = document.createElement("p");
        title.className = "font-semibold";
        title.textContent = p.title;
        const link = document.createElement("a");
        link.href = explorerUrl(p);
        link.className = "text-amber-700 underline";
        link.textContent = "Open in Street View";
        content.append(title, link);
        info.setContent(content);
        info.open({ map, anchor: marker });
      });
      bounds.extend(marker.position!);
      return marker;
    });

    if (places.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(14);
    } else if (places.length > 1) {
      map.fitBounds(bounds, 48);
    }

    return () => {
      info.close();
      markers.forEach((m) => (m.map = null));
    };
  }, [ready, places]);

  if (error) return <p className="py-12 text-center text-sm text-red-500">{error}</p>;

  return (
    <div className="relative">
      <div ref={el} className="h-[65vh] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800" />
      <div className="absolute bottom-3 left-3 flex gap-3 rounded-full bg-white/90 px-3 py-1.5 text-xs text-zinc-800 shadow">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> To draw
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Sketched
        </span>
      </div>
    </div>
  );
}
