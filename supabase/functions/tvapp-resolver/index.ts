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

/**
 * Method 1: Try tvpass.org redirect URL — follows redirects to get actual m3u8
 */
async function resolveViaTvpass(slug: string): Promise<string | null> {
  const url = `${TVPASS_BASE}/live/${slug}/sd`;
  console.log(`[tvpass] Trying: ${url}`);

  try {
    // Follow redirects manually to capture the final URL
    let current = url;
    for (let i = 0; i < 8; i++) {
      const resp = await fetch(current, {
        method: "GET",
        headers: {
          "User-Agent": DEFAULT_UA,
          Referer: `${TVAPP_BASE}/`,
          Origin: TVAPP_BASE,
          Accept: "*/*",
        },
        redirect: "manual",
      });

      const location = resp.headers.get("location");
      if (location && resp.status >= 300 && resp.status < 400) {
        current = location.startsWith("http")
          ? location
          : new URL(location, current).toString();
        console.log(`[tvpass] Redirect ${i + 1}: ${current}`);
        
        // If the redirect URL is already an m3u8, return it immediately
        // Don't fetch it again — the server may reject our headers/IP
        if (current.includes(".m3u8")) {
          console.log(`[tvpass] Resolved m3u8 from redirect: ${current}`);
          return current;
        }
        continue;
      }

      // If we got a 200 and the final URL or response body contains .m3u8
      if (resp.ok) {
        // Check if the final URL itself is an m3u8
        if (current.includes(".m3u8")) {
          console.log(`[tvpass] Resolved m3u8 URL: ${current}`);
          return current;
        }
        // Check body for m3u8 URL
        const body = await resp.text();
        const m3u8Match = body.match(
          /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/
        );
        if (m3u8Match) {
          console.log(`[tvpass] Found m3u8 in body: ${m3u8Match[0]}`);
          return m3u8Match[0];
        }
        // If body starts with #EXTM3U, the current URL IS the m3u8
        if (body.trimStart().startsWith("#EXTM3U")) {
          console.log(`[tvpass] Current URL is m3u8 playlist: ${current}`);
          return current;
        }
        console.log(
          `[tvpass] Got 200 but no m3u8 found. Body preview: ${body.substring(0, 200)}`
        );
      } else {
        console.log(`[tvpass] Got status ${resp.status} for ${current}`);
      }
      break;
    }
  } catch (err) {
    console.error(`[tvpass] Error:`, err);
  }
  return null;
}

/**
 * Method 2: Scrape thetvapp.to channel page for m3u8 URL
 */
async function resolveViaScrape(pageSlug: string): Promise<string | null> {
  const url = `${TVAPP_BASE}/tv/${pageSlug}/`;
  console.log(`[scrape] Trying: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${TVAPP_BASE}/`,
      },
    });

    if (!resp.ok) {
      console.log(`[scrape] Got status ${resp.status}`);
      return null;
    }

    const html = await resp.text();

    // Look for m3u8 URLs in the HTML source (inline scripts, JWPlayer setup, etc.)
    const patterns = [
      // Direct m3u8 URL
      /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g,
      // JWPlayer file property
      /file\s*:\s*["']([^"']+\.m3u8[^"']*)/g,
      // source src
      /src\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g,
    ];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url.includes(".m3u8")) {
          console.log(`[scrape] Found m3u8: ${url}`);
          return url;
        }
      }
    }

    console.log(`[scrape] No m3u8 found in page source`);
  } catch (err) {
    console.error(`[scrape] Error:`, err);
  }
  return null;
}

/**
 * Method 3: Try thetvapp.to event page for sports events
 */
async function resolveViaEvent(eventSlug: string): Promise<string | null> {
  const url = `${TVAPP_BASE}/event/${eventSlug}/`;
  console.log(`[event] Trying: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: `${TVAPP_BASE}/`,
      },
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    const m3u8Match = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
    if (m3u8Match) {
      console.log(`[event] Found m3u8: ${m3u8Match[0]}`);
      return m3u8Match[0];
    }
  } catch (err) {
    console.error(`[event] Error:`, err);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // slug = tvpass channel slug (e.g., "ESPN", "CNN")
    // page_slug = thetvapp page slug (e.g., "espn-live-stream", "cnn-live-stream")
    // event_slug = thetvapp event slug (e.g., "some-event-slug")
    // action = "resolve" (default) returns JSON with URL, "play" proxies the stream
    const slug = params.get("slug");
    const pageSlug = params.get("page_slug");
    const eventSlug = params.get("event_slug");
    const action = params.get("action") || "resolve";

    if (!slug && !pageSlug && !eventSlug) {
      return new Response(
        JSON.stringify({
          error: "Missing parameter",
          usage: {
            resolve:
              "?slug=ESPN  or  ?page_slug=espn-live-stream  or  ?event_slug=some-event",
            play: "?slug=ESPN&action=play  (proxies the resolved stream)",
          },
          available_slugs:
            "Use tvpass.org/playlist/m3u to see available channel slugs",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine cache key
    const cacheKey = slug || pageSlug || eventSlug;

    // Check cache first
    if (cacheKey) {
      const { data: cached } = await supabaseAdmin
        .from("tvapp_cache")
        .select("resolved_url, updated_at")
        .eq("slug", cacheKey)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < CACHE_TTL_MS) {
          console.log(`[cache] HIT for ${cacheKey}, age=${Math.round(age / 60000)}min`);
          const cachedUrl = cached.resolved_url;

          if (action === "play") {
            const proxyBase = `${url.origin}/functions/v1/stream-proxy`;
            const proxyUrl = `${proxyBase}?url=${encodeURIComponent(cachedUrl)}&referer=${encodeURIComponent(TVAPP_BASE + "/")}`;
            return new Response(null, {
              status: 302,
              headers: { ...corsHeaders, Location: proxyUrl },
            });
          }

          return new Response(
            JSON.stringify({
              resolved_url: cachedUrl,
              proxy_url: `${url.origin}/functions/v1/stream-proxy?url=${encodeURIComponent(cachedUrl)}&referer=${encodeURIComponent(TVAPP_BASE + "/")}`,
              cached: true,
              cache_age_minutes: Math.round(age / 60000),
              expires_hint: "This URL has an expiring token. Call this endpoint again when it expires.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.log(`[cache] STALE for ${cacheKey}, age=${Math.round(age / 60000)}min`);
        }
      } else {
        console.log(`[cache] MISS for ${cacheKey}`);
      }
    }

    let resolvedUrl: string | null = null;

    // Try methods in order of reliability
    if (slug) {
      resolvedUrl = await resolveViaTvpass(slug);
    }

    if (!resolvedUrl && pageSlug) {
      resolvedUrl = await resolveViaScrape(pageSlug);
    }

    if (!resolvedUrl && eventSlug) {
      resolvedUrl = await resolveViaEvent(eventSlug);
    }

    // If slug provided but tvpass failed, try deriving page_slug and scraping
    if (!resolvedUrl && slug && !pageSlug) {
      const derivedPageSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-live-stream";
      resolvedUrl = await resolveViaScrape(derivedPageSlug);
    }

    if (!resolvedUrl) {
      return new Response(
        JSON.stringify({
          error: "Could not resolve stream URL",
          tried: {
            tvpass: slug ? `${TVPASS_BASE}/live/${slug}/sd` : null,
            scrape: pageSlug
              ? `${TVAPP_BASE}/tv/${pageSlug}/`
              : slug
              ? `${TVAPP_BASE}/tv/${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-live-stream/`
              : null,
            event: eventSlug ? `${TVAPP_BASE}/event/${eventSlug}/` : null,
          },
          hint: "The stream URL is loaded dynamically via JavaScript. You may need to manually copy the m3u8 URL from the browser network tab.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Upsert cache
    if (cacheKey) {
      const { error: upsertErr } = await supabaseAdmin
        .from("tvapp_cache")
        .upsert(
          { slug: cacheKey, resolved_url: resolvedUrl, updated_at: new Date().toISOString() },
          { onConflict: "slug" }
        );
      if (upsertErr) {
        console.error("[cache] Upsert error:", upsertErr.message);
      } else {
        console.log(`[cache] STORED ${cacheKey}`);
      }
    }

    // If action=play, redirect to stream-proxy with the resolved URL
    if (action === "play") {
      const proxyBase = `${url.origin}/functions/v1/stream-proxy`;
      const proxyUrl = `${proxyBase}?url=${encodeURIComponent(resolvedUrl)}&referer=${encodeURIComponent(TVAPP_BASE + "/")}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: proxyUrl,
        },
      });
    }

    // Default: return resolved URL as JSON
    return new Response(
      JSON.stringify({
        resolved_url: resolvedUrl,
        proxy_url: `${url.origin}/functions/v1/stream-proxy?url=${encodeURIComponent(resolvedUrl)}&referer=${encodeURIComponent(TVAPP_BASE + "/")}`,
        cached: false,
        expires_hint:
          "This URL has an expiring token. Call this endpoint again when it expires.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[tvapp-resolver] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
