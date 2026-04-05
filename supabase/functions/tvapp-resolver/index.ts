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
 * The stream URL is base64-encoded in the Clappr player initialization
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

    // Try to find base64-encoded source in Clappr player init (atob pattern)
    const atobResult = extractAtobSource(html, "link-page");
    if (atobResult) return atobResult;

    // Try to find embedded iframe and fetch embed page
    const iframeMatch = html.match(/(?:iframe|div)[^>]+src=["']([^"']*(?:embed|stream)[^"']*)["']/i);
    if (iframeMatch) {
      const embedUrl = iframeMatch[1].startsWith('http') ? iframeMatch[1] : new URL(iframeMatch[1], url).toString();
      console.log(`[link] Fetching embed: ${embedUrl}`);
      
      try {
        const embedResp = await fetch(embedUrl, {
          headers: { "User-Agent": DEFAULT_UA, Referer: url },
        });
        if (embedResp.ok) {
          const embedHtml = await embedResp.text();
          
          // Try base64 source extraction from embed page
          const embedAtob = extractAtobSource(embedHtml, "embed");
          if (embedAtob) return embedAtob;
          
          // Try direct m3u8
          const embedM3u8 = extractM3u8FromHtml(embedHtml, "embed");
          if (embedM3u8) return embedM3u8;
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
 * Extract base64-encoded source URL from Clappr player (window.atob pattern)
 */
async function extractAtobSource(html: string, source: string): Promise<string | null> {
  // Match: source: window.atob('base64string') or atob("base64string")
  const atobPatterns = [
    /(?:source|src)\s*:\s*(?:window\.)?atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g,
    /atob\s*\(\s*['"]([A-Za-z0-9+/=]{20,})['"]\s*\)/g,
  ];

  for (const pattern of atobPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      try {
        const decoded = atob(match[1]);
        console.log(`[${source}] Decoded atob: ${decoded}`);
        if (decoded.startsWith('http')) {
          // If it's a playlist URL, fetch it server-side to get the actual m3u8
          if (decoded.includes('/playlist/') || decoded.includes('/load-playlist')) {
            console.log(`[${source}] Fetching playlist URL server-side: ${decoded}`);
            try {
              const playlistResp = await fetch(decoded, {
                headers: { "User-Agent": DEFAULT_UA, Referer: TVAPP_LINK_BASE + "/" },
              });
              if (playlistResp.ok) {
                const playlistBody = await playlistResp.text();
                // If it's m3u8 content, the decoded URL itself is the stream
                if (playlistBody.trimStart().startsWith('#EXTM3U') || playlistBody.trimStart().startsWith('#EXT')) {
                  console.log(`[${source}] Playlist URL returns m3u8 content directly`);
                  return decoded;
                }
                // Try to extract m3u8 from playlist response
                const m3u8Match = playlistBody.match(/https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/);
                if (m3u8Match) {
                  console.log(`[${source}] Found m3u8 in playlist response: ${m3u8Match[0]}`);
                  return m3u8Match[0];
                }
                // Try JSON response
                try {
                  const json = JSON.parse(playlistBody);
                  const jsonUrl = json.url || json.source || json.stream || json.file || json.playlist;
                  if (jsonUrl && typeof jsonUrl === 'string') {
                    console.log(`[${source}] Found URL in playlist JSON: ${jsonUrl}`);
                    return jsonUrl;
                  }
                } catch { /* not JSON */ }
                console.log(`[${source}] Playlist response (first 500 chars): ${playlistBody.substring(0, 500)}`);
              } else {
                console.log(`[${source}] Playlist fetch failed: ${playlistResp.status}`);
              }
            } catch (fetchErr) {
              console.error(`[${source}] Playlist fetch error:`, fetchErr);
            }
            // Return the playlist URL anyway as fallback — it'll be proxied
            return decoded;
          }
          if (decoded.includes('.m3u8')) {
            return decoded;
          }
          // Return any http URL as potential stream source
          return decoded;
        }
      } catch (e) {
        console.error(`[${source}] atob decode failed:`, e);
      }
    }
  }
  return null;
}
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
  const seen = new Set<string>();
  
  try {
    const resp = await fetch(TVAPP_LINK_BASE, {
      headers: { "User-Agent": DEFAULT_UA },
    });
    if (resp.ok) {
      const html = await resp.text();
      
      // Extract full URLs: href="https://thetvapp.link/nba/slug/id" or href="/nba/slug/id"
      // Also handle /watch/sport/slug format
      const fullUrlPattern = /href=["'](?:https?:\/\/thetvapp\.link)?\/?((?:watch\/)?[a-z]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)["'][^>]*>([^<]+)/gi;
      
      for (const match of html.matchAll(fullUrlPattern)) {
        let path = match[1];
        const rawTitle = match[2].trim().replace(/:\s*$/, '').trim();
        
        // Skip non-event paths
        if (path.includes('guide') || path.includes('channel') || path.includes('tv/')) continue;
        
        if (seen.has(path)) continue;
        seen.add(path);
        
        // Determine sport from path
        const parts = path.replace(/^watch\//, '').split('/');
        const sport = parts[0];
        const title = rawTitle || parts.slice(1).join(' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        events.push({ sport, slug: path, title, eventId: parts[parts.length - 1] });
      }
    }
  } catch (err) {
    console.error(`[events] Scrape error:`, err);
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
