# Sketch Atlas

Find random Street View spots around the world, like [MapCrunch](https://www.mapcrunch.com/), and save the ones you want to draw.

- **Explore:** Go, Back, Tour mode, and Search to explore around a city or address.
- **Filters:** countries, area (city center, neighborhoods or countryside), themes (old towns, harbors, markets, canals), indoor imagery, and stealth mode.
- **Guides:** crop to your page shape, a rule-of-thirds grid, an eye-level line, and grayscale, notan or 3/5-value views.
- **Colors:** pick a color from the view, then see how to mix it from your own paints, or which common paints would mix it best. Manage your paints on `/paints` (watercolor or opaque).
- **My spots:** a grid or world map of saved spots, with notes, tags, to-draw/sketched status, JSON export and import, and optional sync between devices.

Keyboard: `N` next, `B` back, `S` save, `T` tour, `F` filters, `C` colors, `G` guides, `L` level the view.

Picking a color straight from the view uses the browser's EyeDropper API (Chrome and Edge). Other browsers fall back to the system color picker.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev                  # http://localhost:3000
```

### Google Maps (required)

In the [Google Cloud console](https://console.cloud.google.com/google/maps-apis), enable these APIs for your key:

| API | Used for |
| --- | --- |
| Maps JavaScript API | Street View, minimap, map of spots (required) |
| Street View Static API | Thumbnails and reference images on My spots |
| Geocoding API | Searching for addresses that aren't in the built-in city list |

### Supabase sync (optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `spots` and `palettes` tables.
3. In **Authentication → URL Configuration**, set the Site URL to where the app runs (e.g. `http://localhost:3000`), and add `http://localhost:3000/saved` (plus your deployed URL, if any) to Redirect URLs.
4. From **Project Settings → API Keys**, copy the project URL and the publishable key (the legacy anon key also works) into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then restart the dev server.
5. On **My spots**, click "Sync your spots across devices" (this also syncs your paints) and sign in with the emailed link. Do this on each device.

Supabase's built-in email sender only allows a few sign-in emails per hour. That's fine for personal use; set up custom SMTP in Supabase if you need more.
