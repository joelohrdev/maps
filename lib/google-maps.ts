import type { Filters } from "./filters";
import { COUNTRIES } from "./places";
import { THEME_SPOTS } from "./themes";

declare global {
  interface Window {
    __sketchAtlasMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

let loading: Promise<void> | null = null;

/** Injects the Maps JavaScript API once; later calls reuse the same promise. */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    window.__sketchAtlasMapsReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      callback: "__sketchAtlasMapsReady",
    })}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Google Maps. Check your internet connection."));
    };
    document.head.append(script);
  });
  return loading;
}

// Distance (km) from a seed city to scatter the search point, and how far
// (m) Street View may look for the nearest panorama from there.
const AREA_SEARCH = {
  core: { minKm: 0, maxKm: 2.5, radiusM: 400 },
  neighborhood: { minKm: 2.5, maxKm: 12, radiusM: 1500 },
  countryside: { minKm: 15, maxKm: 60, radiusM: 8000 },
} as const;

const THEME_SEARCH = { minKm: 0, maxKm: 0.6, radiusM: 250 };

interface Seed {
  lat: number;
  lng: number;
  minKm: number;
  maxKm: number;
  radiusM: number;
}

const PARALLEL_TRIES = 3;
const MAX_ROUNDS = 8;

export interface FoundPanorama {
  panoId: string;
  lat: number;
  lng: number;
}

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

function scatter(lat: number, lng: number, minKm: number, maxKm: number) {
  // sqrt keeps points evenly spread over the ring instead of bunching at the center.
  const km = Math.sqrt(minKm ** 2 + Math.random() * (maxKm ** 2 - minKm ** 2));
  const bearing = Math.random() * 2 * Math.PI;
  const dLat = (km / 111.32) * Math.cos(bearing);
  const dLng = (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(bearing);
  return { lat: lat + dLat, lng: lng + dLng };
}

export function panoramaSources(filters: Filters): google.maps.StreetViewSourceString[] {
  // Multiple sources are intersected: official Google imagery AND outdoors.
  return filters.officialOnly ? ["google", "outdoor"] : ["default"];
}

/** Where to search next: around the anchor, a themed spot, or a city in a selected country. */
function seedPicker(filters: Filters): () => Seed {
  const area = AREA_SEARCH[filters.area];
  if (filters.anchor) {
    const { lat, lng } = filters.anchor;
    return () => ({ lat, lng, ...area });
  }
  if (filters.theme !== "any") {
    const spots = THEME_SPOTS[filters.theme].filter(([, , , code]) => filters.countries.includes(code));
    if (spots.length === 0) throw new Error("None of this theme's places are in your selected countries.");
    return () => {
      const [, lat, lng] = pick(spots);
      return { lat, lng, ...THEME_SEARCH };
    };
  }
  const countries = COUNTRIES.filter((c) => filters.countries.includes(c.code));
  if (countries.length === 0) throw new Error("Pick at least one country in Filters.");
  return () => {
    const [, lat, lng] = pick(pick(countries).cities);
    return { lat, lng, ...area };
  };
}

export async function findRandomPanorama(
  service: google.maps.StreetViewService,
  filters: Filters,
  exclude: Set<string>,
): Promise<FoundPanorama> {
  const nextSeed = seedPicker(filters);

  const tryOnce = async (): Promise<FoundPanorama | null> => {
    const seed = nextSeed();
    try {
      const { data } = await service.getPanorama({
        location: scatter(seed.lat, seed.lng, seed.minKm, seed.maxKm),
        radius: seed.radiusM,
        preference: "nearest" as google.maps.StreetViewPreference,
        sources: panoramaSources(filters),
      });
      const panoId = data.location?.pano;
      const latLng = data.location?.latLng;
      if (!panoId || !latLng || exclude.has(panoId)) return null;
      return { panoId, lat: latLng.lat(), lng: latLng.lng() };
    } catch {
      return null; // ZERO_RESULTS: that point had no imagery nearby.
    }
  };

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const results = await Promise.all(Array.from({ length: PARALLEL_TRIES }, tryOnce));
    const found = results.find((r) => r !== null);
    if (found) return found;
  }
  throw new Error("Couldn't find Street View imagery with these filters. Try more countries or a different area.");
}
