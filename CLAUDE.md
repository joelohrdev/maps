# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev`: dev server at http://localhost:3000. It also rewrites the Next.js block in `AGENTS.md`.
- `npm run build`: production build. It also type-checks the code.
- `npm run lint`: ESLint 9 flat config (`eslint.config.mjs`) using `eslint-config-next` core-web-vitals and typescript presets.
- No test framework is set up yet.

## Stack and structure

The project is on **Next.js 16.3 / React 19.2**. Before using any Next.js API, read the docs bundled in `node_modules/next/dist/docs/` (`01-app/` covers the App Router). Don't rely on memory of older versions.

- **App Router only.** Routes live in `app/`, and there is no `src/` directory. `app/layout.tsx` is the root layout and loads the Geist fonts through `next/font/google` as CSS variables.
- **Typed route helpers.** Types like `LayoutProps<"/">` (and `PageProps`) are global and are generated into `.next/types/` by `next dev` or `next build`. Don't import them. If they're missing, run the dev server or a build.
- **Tailwind CSS v4** runs through `@tailwindcss/postcss`. There is no `tailwind.config.*` file; theme tokens are set in CSS with `@theme inline` in `app/globals.css`. Light and dark colors are CSS variables (`--background`, `--foreground`) that switch on `prefers-color-scheme`.
- **Import alias:** `@/*` maps to the project root, for example `@/app/...`.
- The git repository root is this directory (`maps/maps`), not the parent `maps/`.

## App: Sketch Atlas

Sketch Atlas is a MapCrunch-style random Street View explorer for urban sketching. Everything runs on the client; there is no backend.

- **Google Maps key:** set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`. It needs the Maps JavaScript API; the Street View Static API is only used for thumbnails on `/saved`. Without a key, `/` shows setup instructions.
- **Loading Maps:** `lib/google-maps.ts` injects the Maps script once (`loading=async`), so classes must come from `google.maps.importLibrary(...)`, not from the global `google.maps.*`.
- **Random spots:** `findRandomPanorama` in `lib/google-maps.ts` picks a seed point, scatters a search point around it, and calls `StreetViewService.getPanorama`. It retries in parallel batches. The seed comes from the search anchor if one is set, otherwise from a theme spot in `lib/themes.ts` if a theme is picked, otherwise from a random city in `lib/places.ts`. Countries come from those curated lists, not from polygons. To add places, add entries there.
- **State:** `lib/local-store.ts` provides `useSyncExternalStore`-backed localStorage stores. `filtersStore` holds the filters and `savedStore` holds the saved spots. Their server snapshot is the fallback value. Use `store.get()` inside Maps event callbacks to avoid stale closures.
- **Sync (optional):** Supabase, configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, with the schema in `supabase/schema.sql`. Sign-in uses email magic links (implicit flow, so a link works on any device). `components/SyncManager.tsx` (mounted in the layout) runs `syncNow` in `lib/sync.ts`. That's a per-spot last-write-wins merge: every edit must go through `upsertPlace`/`removePlace` so `updatedAt` and deletion tombstones (`deletedStore`) stay correct.
- **Links:** `/?pano=ID&h=heading&p=pitch&z=zoom` opens an exact view. It's used by Share and by the saved-spot links, and `Explorer` reads it through `useSearchParams`, so `app/page.tsx` wraps it in `<Suspense>`.
- **Lint:** the ESLint config enables React Compiler rules such as `react-hooks/set-state-in-effect` and the no-refs-during-render check.
