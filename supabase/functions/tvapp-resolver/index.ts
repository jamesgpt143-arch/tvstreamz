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

async function resolveViaTvpass(slug: string): Promise<string | null> {
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

async function resolveViaScrape(path: string): Promise<string | null> {
  const isDirectPath = path.includes('/');
  const url = isDirectPath ? `${TVAPP_BASE}/${path}` : `${TVAPP_BASE}/tv/${path}/`;
  
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
    return extractM3u8FromHtml(html);
  } catch (err) {}
  return null;
}

async function resolveViaLink(eventPath: string): Promise<string | null> {
  const url = `${TVAPP_BASE}/${eventPath}`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": DEFAULT_UA, Accept: "text/html", Referer: `${TVAPP_BASE}/` },
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    const directM3u8 = extractM3u8FromHtml(html);
    if (directM3u8) return directM3u8;

    const atobResult = extractAtobSource(html);
    if (atobResult) {
      if (!atobResult.includes('.m3u8')) {
        const followed = await followPlaylistUrl(atobResult);
        if (followed) return followed;
      }
      return atobResult;
    }

    const iframeMatch = html.match(/(?:iframe|div)[^>]+src=["']([^"']*(?:embed|stream)[^"']*)["']/i);
    if (iframeMatch) {
      const embedUrl = iframeMatch[1].startsWith('http') ? iframeMatch[1] : new URL(iframeMatch[1], url).toString();
      try {
        const embedResp = await fetch(embedUrl, { headers: { "User-Agent": DEFAULT_UA, Referer: url } });
        if (embedResp.ok) {
          const setCookies = embedResp.headers.getSetCookie?.() || [];
          const cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
          const embedHtml = await embedResp.text();
          
          const embedAtob = extractAtobSource(embedHtml);
          if (embedAtob) {
            if (!embedAtob.includes('.m3u8')) {
              const followed = await followPlaylistUrl(embedAtob, embedUrl, cookieStr);
              if (followed) return followed;
            }
            return embedAtob;
          }
          
          const embedM3u8 = extractM3u8FromHtml(embedHtml);
          if (embedM3u8) return embedM3u8;
        }
      } catch (err) {}
    }
  } catch (err) {}
  return null;
}

async function followPlaylistUrl(playlistUrl: string, embedReferer?: string, cookies?: string): Promise<string | null> {
  const referers = [ ...(embedReferer ? [embedReferer] : []), new URL(playlistUrl).origin + "/", TVAPP_BASE + "/" ];
  for (const referer of referers) {
    try {
      let current = playlistUrl;
      for (let i = 0; i < 5; i++) {
        const headers: Record<string, string> = { "User-Agent": DEFAULT_UA, Referer: referer, Origin: new URL(referer).origin };
        if (cookies) headers["Cookie"] = cookies;
        
        const resp = await fetch(current, { headers, redirect: "manual" });
        const location = resp.headers.get("location");
        
        if (location && resp.status >= 300 && resp.status < 400) {
          current = location.startsWith("http") ? location : new URL(location, current).toString();
          if (current.includes(".m3u8")) return current;
          continue;
        }
        if (resp.ok) {
          if (current.includes(".m3u8")) return current;
          const body = await resp.text();
          if (body.trimStart().startsWith("#EXTM3U")) return current;
          const m3u8Match = body.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
          if (m3u8Match) return m3u8Match[0];
          return null; 
        }
        break;
      }
    } catch (err) {}
  }
  return null;
}

function extractAtobSource(html: string): string | null {
  const atobPatterns = [ /(?:source|src)\s*:\s*(?:window\.)?atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g, /atob\s*\(\s*['"]([A-Za-z0-9+/=]{20,})['"]\s*\)/g ];
  for (const pattern of atobPatterns) {
    for (const match of html.matchAll(pattern)) {
      try {
        const decoded = atob(match[1]);
        if (decoded.startsWith('http')) return decoded;
      } catch (e) {}
    }
  }
  return null;
}

function extractM3u8FromHtml(html: string): string | null {
  const patterns = [ /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/g, /file\s*:\s*["']([^"']+\.m3u8[^"']*)/g, /src\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g, /source\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g, /url\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/g ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const foundUrl = match[1] || match[0];
      if (foundUrl.includes(".m3u8")) return foundUrl;
    }
  }
  return null;
}

/**
 * BAGONG SCRAPER PARA SA NBA (Aayusin ang time extraction)
 */
async function scrapeEvents(): Promise<any[]> {
  const events: any[] = [];
  const seen = new Set<string>();
  
  try {
    const resp = await fetch(`${TVAPP_BASE}/nba`, {
      headers: { "User-Agent": DEFAULT_UA },
    });
    if (resp.ok) {
      const html = await resp.text();
      const eventPattern = /<a[^>]*href=["'](\/event\/[a-z0-9-]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
      
      for (const match of html.matchAll(eventPattern)) {
        let path = match[1];
        if (path.startsWith('/')) path = path.substring(1);
        
        let titleRaw = match[2] || '';
        let title = titleRaw.replace(/<[^>]*>/g, '').replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        let eventTime = '';
        
        // Matalinong Regex para makuha yung time (e.g. "8:00 PM EST")
        const timeMatch = title.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*EST|\s*EDT)?)/i);
        if (timeMatch) {
          eventTime = timeMatch[1].trim();
          if (!eventTime.includes('EST') && !eventTime.includes('EDT')) {
            eventTime += ' EST'; 
          }
          // Tanggalin ang time sa title para pangalan lang ng teams ang matira
          title = title.replace(timeMatch[1], '').replace(/[-@|]/g, '').trim();
        } else if (title.includes('@')) {
          const parts = title.split('@');
          title = parts[0].trim();
          eventTime = parts[1].trim() + ' EST';
        }
        
        if (seen.has(path)) continue;
        seen.add(path);
        
        const eventId = path.split('/')[1] || path;
        events.push({ sport: 'nba', slug: path, title, eventId, eventTime });
      }
    }
  } catch (err) {}
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

    if (listEvents === "true") {
      const events = await scrapeEvents();
      return new Response(JSON.stringify({ events }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!slug && !pageSlug && !eventSlug) {
      return new Response(JSON.stringify({ error: "Missing parameter" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cacheKey = slug || pageSlug || eventSlug;

    if (cacheKey && !forceRefresh) {
      const { data: cached } = await supabaseAdmin
        .from("tvapp_cache")
        .select("resolved_url, updated_at")
        .eq("slug", cacheKey)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < CACHE_TTL_MS) {
          return new Response(JSON.stringify({ resolved_url: cached.resolved_url, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    let resolvedUrl: string | null = null;

    if (eventSlug) {
      resolvedUrl = await resolveViaLink(eventSlug);
      if (!resolvedUrl) resolvedUrl = await resolveViaScrape(eventSlug);
    } else if (slug) {
      resolvedUrl = await resolveViaTvpass(slug);
      if (!resolvedUrl) resolvedUrl = await resolveViaScrape(slug);
      if (!resolvedUrl && !slug.includes('/')) {
        const derivedPageSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-live-stream";
        resolvedUrl = await resolveViaScrape(derivedPageSlug);
      }
      if (!resolvedUrl && slug.includes('/')) resolvedUrl = await resolveViaLink(slug);
    } else if (pageSlug) {
      resolvedUrl = await resolveViaScrape(pageSlug);
    }

    if (!resolvedUrl) {
      return new Response(JSON.stringify({ error: "Could not resolve stream URL" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (cacheKey) {
      await supabaseAdmin.from("tvapp_cache").upsert({ slug: cacheKey, resolved_url: resolvedUrl, updated_at: new Date().toISOString() }, { onConflict: "slug" });
    }

    return new Response(JSON.stringify({ resolved_url: resolvedUrl, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
