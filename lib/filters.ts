import { createLocalStore } from "./local-store";
import { ALL_COUNTRY_CODES } from "./places";
import { THEME_OPTIONS, type Theme } from "./themes";

export type Area = "core" | "neighborhood" | "countryside";

/** A place picked from search; while set, Go stays around it instead of roaming the world. */
export interface Anchor {
  label: string;
  lat: number;
  lng: number;
}

export interface Filters {
  countries: string[];
  area: Area;
  theme: Theme;
  anchor: Anchor | null;
  /** Official Google outdoor imagery only; off also allows indoor and user photospheres. */
  officialOnly: boolean;
  /** Hide the address, minimap and road labels so the place is a surprise. */
  stealth: boolean;
  tourSeconds: number;
}

export const AREA_OPTIONS: { value: Area; label: string; hint: string }[] = [
  { value: "core", label: "City center", hint: "Busy streets, old towns, landmarks" },
  { value: "neighborhood", label: "Neighborhoods", hint: "Residential streets and local shops" },
  { value: "countryside", label: "Countryside", hint: "Villages, roads and landscapes" },
];

export const TOUR_OPTIONS = [15, 30, 60, 120, 300];

export const DEFAULT_FILTERS: Filters = {
  countries: ALL_COUNTRY_CODES,
  area: "core",
  theme: "any",
  anchor: null,
  officialOnly: true,
  stealth: false,
  tourSeconds: 60,
};

export const filtersStore = createLocalStore<Filters>(
  "sketch-atlas:filters",
  DEFAULT_FILTERS,
  (raw) => {
    const f = { ...DEFAULT_FILTERS, ...(raw as Partial<Filters>) };
    f.countries = f.countries.filter((c) => ALL_COUNTRY_CODES.includes(c));
    if (!THEME_OPTIONS.some((t) => t.value === f.theme)) f.theme = "any";
    return f;
  },
);
