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
 * Method 1: Try tvpass.org redirect URL
 */
async function resolveViaTvpass(slug: string): Promise<string | null> {
  // Wag gamitin ang tvpass kapag sports game ito (may slash ang slug)
  if (slug.includes('/')) return null;

  const url = `${TVPASS_BASE}/live/${slug}/sd`;
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
      break;
    }
  } catch (err) {}
  return null;
}

/**
 * Method 2: Scrape any thetvapp.to page for m3u8 URL
 * Updated para suportahan ang mga direct paths (tulad ng nba/game-slug)
 */
async function resolveViaScrape(path: string): Promise<string | null> {
  // Kapag ang slug ay may '/', ibig sabihin direct path ito sa sports game (e.g. "nba/team-vs-team")
  // Kapag walang '/', default TV channel path ito ("tv/channel-slug")
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

    const patterns = [
      /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g,
      /file\s*:\s*["']([^"']+\.m3u8[^"']*)/g,
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
  } catch (err) {}
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const slug = params.get("slug");
    const pageSlug = params.get("page_slug");
    const eventSlug = params.get("event_slug");
    const forceRefresh = params.get("force_refresh") === "true"; // Added force_refresh

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
          return new Response(
            JSON.stringify({ resolved_url: cached.resolved_url, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    let resolvedUrl: string | null = null;

    if (slug) {
      resolvedUrl = await resolveViaTvpass(slug);
      if (!resolvedUrl) {
        resolvedUrl = await resolveViaScrape(slug);
      }
      if (!resolvedUrl && !slug.includes('/')) {
        const derivedPageSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-live-stream";
        resolvedUrl = await resolveViaScrape(derivedPageSlug);
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
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
