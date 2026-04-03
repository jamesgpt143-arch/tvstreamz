import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const TVAPP_BASE = "https://thetvapp.to";
const TVPASS_BASE = "https://tvpass.org";
const TVAPP_LINK_BASE = "https://thetvapp.link";

/**
 * Method 1: Try tvpass.org redirect URL
 */
async function resolveViaTvpass(slug: string): Promise<string | null> {
  if (slug.includes('/')) return null;

  const url = `${TVPASS_BASE}/live/${slug}/sd`;
  console.log(`[tvpass] Trying: ${url}`);
  try {
    let current = url;
    for (let i = 0; i < 8; i++) {
      const resp = await fetch(current, {
        method: "GET",
        headers: { "User-Agent": DEFAULT_UA, Referer: `${TVAPP_BASE}/`, Origin: TVAPP_BASE },
        redirect: "manual",
      });

      const location = resp.headers.get("location");
      if (location && resp.status >= 300 && resp.status < 400) {
        current = location.startsWith("http") ? location : new URL(location, current).toString();
        if (current.includes(".m3u8")) return current;
        continue;
      }
      if (resp.ok) {
        if (current.includes(".m3u8")) return current;
        const body = await resp.text();
        const m3u8Match = body.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
        if (m3u8Match) return m3u8Match[0];
        if (body.trimStart().startsWith("#EXTM3U")) return current;
      }
      console.log(`[tvpass] Got status ${resp.status} for ${current}`);
      break;
    }
  } catch (err) {
    console.error(`[tvpass] Error:`, err);
  }
  return null;
}

/**
 * Method 2: Scrape any thetvapp.to page for m3u8 URL
 */
async function resolveViaScrape(path: string): Promise<string | null> {
  const isDirectPath = path.includes('/');
  const url = isDirectPath ? `${TVAPP_BASE}/${path}` : `${TVAPP_BASE}/tv/${path}/`;
  
  console.log(`[scrape] Trying: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${TVAPP_BASE}/`,
      },
    });

    if (!resp.ok) return null;
    const html = await resp.text();
    return extractM3u8FromHtml(html, "scrape");
  } catch (err) {
    console.error(`[scrape] Error:`, err);
  }
  return null;
}

/**
 * Method 3: Resolve via thetvapp.link (for live events like NBA games)
 * These pages embed a player from an external domain (e.g., gooz.aapmains.net)
 */
async function resolveViaLink(eventPath: string): Promise<string | null> {
  const url = `${TVAPP_LINK_BASE}/${eventPath}`;
  console.log(`[link] Trying: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${TVAPP_LINK_BASE}/`,
      },
    });

    if (!resp.ok) {
      console.log(`[link] Got status ${resp.status}`);
      return null;
    }

    const html = await resp.text();

    // First try direct m3u8 in page
    const directM3u8 = extractM3u8FromHtml(html, "link");
    if (directM3u8) return directM3u8;

    // Try to find embedded iframe
    const iframePatterns = [
      /iframe[^>]+src=["']([^"']+)["']/gi,
      /embed[^>]+src=["']([^"']+)["']/gi,
      /player[^>]+src=["']([^"']+)["']/gi,
    ];

    const embedUrls: string[] = [];
    for (const pattern of iframePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const src = match[1];
        if (src && !src.includes('google') && !src.includes('facebook') && !src.includes('ads')) {
          embedUrls.push(src.startsWith('http') ? src : new URL(src, url).toString());
        }
      }
    }

    console.log(`[link] Found ${embedUrls.length} embed URLs`);

    // Fetch each embed URL and try to extract m3u8
    for (const embedUrl of embedUrls) {
      console.log(`[link] Fetching embed: ${embedUrl}`);
      try {
        const embedResp = await fetch(embedUrl, {
          headers: {
            "User-Agent": DEFAULT_UA,
            Referer: url,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (!embedResp.ok) continue;
        const embedHtml = await embedResp.text();

        const m3u8 = extractM3u8FromHtml(embedHtml, "embed");
        if (m3u8) return m3u8;

        // Some embeds have nested iframes
        const nestedIframes = embedHtml.matchAll(/iframe[^>]+src=["']([^"']+)["']/gi);
        for (const nestedMatch of nestedIframes) {
          const nestedSrc = nestedMatch[1];
          if (!nestedSrc || nestedSrc.includes('google') || nestedSrc.includes('ads')) continue;
          const nestedUrl = nestedSrc.startsWith('http') ? nestedSrc : new URL(nestedSrc, embedUrl).toString();
          console.log(`[link] Fetching nested embed: ${nestedUrl}`);
          try {
            const nestedResp = await fetch(nestedUrl, {
              headers: { "User-Agent": DEFAULT_UA, Referer: embedUrl },
            });
            if (!nestedResp.ok) continue;
            const nestedHtml = await nestedResp.text();
            const nestedM3u8 = extractM3u8FromHtml(nestedHtml, "nested-embed");
            if (nestedM3u8) return nestedM3u8;
          } catch {}
        }
      } catch (err) {
        console.error(`[link] Embed fetch error:`, err);
      }
    }
  } catch (err) {
    console.error(`[link] Error:`, err);
  }
  return null;
}

/**
 * Extract m3u8 URL from HTML content
 */
function extractM3u8FromHtml(html: string, source: string): string | null {
  const patterns = [
    /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/g,
    /file\s*:\s*["']([^"']+\.m3u8[^"']*)/g,
    /src\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g,
    /source\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g,
    /url\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g,
  ];

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const foundUrl = match[1] || match[0];
      if (foundUrl.includes(".m3u8")) {
        console.log(`[${source}] Found m3u8: ${foundUrl}`);
        return foundUrl;
      }
    }
  }
  console.log(`[${source}] No m3u8 found in page source`);
  return null;
}

/**
 * Scrape live events listing from thetvapp.link
 */
async function scrapeEvents(): Promise<any[]> {
  const events: any[] = [];
  const categories = ["nba", "nfl", "nhl", "mlb", "soccer", "ncaa", "cfb"];
  
  // Try the main page first
  try {
    const resp = await fetch(TVAPP_LINK_BASE, {
      headers: { "User-Agent": DEFAULT_UA },
    });
    if (resp.ok) {
      const html = await resp.text();
      // Extract event links: /sport/team-vs-team/id
      const linkPattern = /href=["']\/?([a-z]+\/[a-z0-9-]+\/\d+)["']/gi;
      const matches = html.matchAll(linkPattern);
      const seen = new Set<string>();
      for (const match of matches) {
        const path = match[1];
        if (seen.has(path)) continue;
        seen.add(path);
        
        const parts = path.split('/');
        if (parts.length >= 3) {
          const sport = parts[0];
          const gameSlug = parts[1];
          const eventId = parts[2];
          const title = gameSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          events.push({ sport, slug: path, title, eventId });
        }
      }
    }
  } catch (err) {
    console.error(`[events] Main page scrape error:`, err);
  }

  // Also try category pages
  for (const cat of categories) {
    try {
      const resp = await fetch(`${TVAPP_LINK_BASE}/${cat}`, {
        headers: { "User-Agent": DEFAULT_UA },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const linkPattern = new RegExp(`href=["']\\/?${cat}\\/([a-z0-9-]+)\\/(\\d+)["']`, 'gi');
      const titlePattern = new RegExp(`<a[^>]+href=["']\\/?${cat}\\/([a-z0-9-]+)\\/\\d+["'][^>]*>([^<]+)`, 'gi');
      
      const titleMap = new Map<string, string>();
      for (const tm of html.matchAll(titlePattern)) {
        titleMap.set(tm[1], tm[2].trim());
      }

      for (const match of html.matchAll(linkPattern)) {
        const gameSlug = match[1];
        const eventId = match[2];
        const path = `${cat}/${gameSlug}/${eventId}`;
        const title = titleMap.get(gameSlug) || gameSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        if (!events.find(e => e.slug === path)) {
          events.push({ sport: cat, slug: path, title, eventId });
        }
      }
    } catch {}
  }

  console.log(`[events] Found ${events.length} events total`);
  return events;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const slug = params.get("slug");
    const pageSlug = params.get("page_slug");
    const eventSlug = params.get("event_slug");
    const listEvents = params.get("list_events");
    const forceRefresh = params.get("force_refresh") === "true";

    // List events endpoint
    if (listEvents === "true") {
      const events = await scrapeEvents();
      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!slug && !pageSlug && !eventSlug) {
      return new Response(JSON.stringify({ error: "Missing parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = slug || pageSlug || eventSlug;

    // Check cache
    if (cacheKey && !forceRefresh) {
      const { data: cached } = await supabaseAdmin
        .from("tvapp_cache")
        .select("resolved_url, updated_at")
        .eq("slug", cacheKey)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < CACHE_TTL_MS) {
          console.log(`[cache] HIT for ${cacheKey}`);
          return new Response(
            JSON.stringify({ resolved_url: cached.resolved_url, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      console.log(`[cache] MISS for ${cacheKey}`);
    }

    let resolvedUrl: string | null = null;

    if (eventSlug) {
      // Event slug — use thetvapp.link with embed extraction
      resolvedUrl = await resolveViaLink(eventSlug);
      // Fallback: try scraping thetvapp.to with the event path
      if (!resolvedUrl) {
        resolvedUrl = await resolveViaScrape(eventSlug);
      }
    } else if (slug) {
      // Regular channel slug
      resolvedUrl = await resolveViaTvpass(slug);
      if (!resolvedUrl) {
        resolvedUrl = await resolveViaScrape(slug);
      }
      if (!resolvedUrl && !slug.includes('/')) {
        const derivedPageSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-live-stream";
        resolvedUrl = await resolveViaScrape(derivedPageSlug);
      }
      // If slug contains '/', also try thetvapp.link
      if (!resolvedUrl && slug.includes('/')) {
        resolvedUrl = await resolveViaLink(slug);
      }
    } else if (pageSlug) {
      resolvedUrl = await resolveViaScrape(pageSlug);
    }

    if (!resolvedUrl) {
      return new Response(
        JSON.stringify({ error: "Could not resolve stream URL" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to Cache
    if (cacheKey) {
      await supabaseAdmin.from("tvapp_cache").upsert(
        { slug: cacheKey, resolved_url: resolvedUrl, updated_at: new Date().toISOString() },
        { onConflict: "slug" }
      );
    }

    return new Response(
      JSON.stringify({ resolved_url: resolvedUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[server] Error:", error);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
