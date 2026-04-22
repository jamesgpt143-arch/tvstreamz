

## Plan: Support Live Events from ThetvApp + Fix Build Error

### Problem
1. The tvapp-resolver only scrapes `thetvapp.to`, but live events use `thetvapp.link` domain with a different URL structure (e.g., `nba/charlotte-hornets-phoenix-suns/35160715296`).
2. The fetched event page embeds a player from an external domain (`gooz.aapmains.net`) — the m3u8 URL may be inside that embed, not directly on the page.
3. There's a TypeScript build error: `Promise.any` requires `ES2021` but `tsconfig.app.json` targets `ES2020`.
4. There's no UI to browse/play live events — only static channels are supported.

### What Will Change

**1. Fix Build Error** (`tsconfig.app.json`)
- Change `"lib"` from `["ES2020", ...]` to `["ES2021", ...]` so `Promise.any` is available.

**2. Update tvapp-resolver Edge Function** (`supabase/functions/tvapp-resolver/index.ts`)
- Add `thetvapp.link` as an alternate base URL alongside `thetvapp.to`.
- Add a new `resolveViaEmbed` method that:
  - Fetches the event page from `thetvapp.link/{sport}/{slug}/{id}`.
  - Extracts the embed iframe URL (e.g., from `gooz.aapmains.net`).
  - Fetches the embed page and extracts the `.m3u8` stream URL from it.
- Handle the `event_slug` parameter properly (currently accepted but never used) — route it through the new embed-based resolver.
- Support full event paths with 3 segments (sport/game-slug/event-id).

**3. Create Live Events Page** (`src/pages/LiveEvents.tsx`)
- A new page at route `/live-events` that scrapes/lists available live events from thetvapp.
- Or alternatively, let admin add event URLs manually in the admin dashboard.

**4. Add Event Playback Support** (`src/pages/WatchLive.tsx` + `src/components/LivePlayer.tsx`)
- Allow passing an event URL/slug to the resolver via query parameter.
- The LivePlayer already supports tvappSlug — extend it to handle event-type slugs (with `/`).

### Technical Details

**Resolver update — new method:**
```text
resolveViaEmbed(eventPath):
  1. Fetch https://thetvapp.link/{eventPath}
  2. Extract iframe src (embed URL)
  3. Fetch embed page
  4. Extract .m3u8 from embed page JS/HTML
  5. Return m3u8 URL
```

**Event slug format:**
- `nba/charlotte-hornets-phoenix-suns/35160715296` → full path passed as `event_slug`
- Resolver constructs: `https://thetvapp.link/nba/charlotte-hornets-phoenix-suns/35160715296`

**Approach decision needed:**

Since live events are temporary (they expire after the game), we have two options for how users find events:

- **Option A**: Admin manually adds event channels with the tvapp_slug field (e.g., `nba/charlotte-hornets-phoenix-suns/35160715296`). Simple, works with existing channel system.
- **Option B**: Build an auto-scraping Live Events page that fetches today's events from thetvapp.link. More complex but automatic.

### Steps
1. Fix `tsconfig.app.json` lib to ES2021
2. Update `tvapp-resolver` to support `thetvapp.link` event URLs and embed extraction
3. Deploy and test the resolver with the NBA event URL
4. Decide on events discovery approach (manual admin vs auto-scrape)
5. Add route/UI for live event playback

