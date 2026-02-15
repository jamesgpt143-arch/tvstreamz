import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface IptvConfig {
  portal_url: string;
  mac_address: string;
}

// Get IPTV config from site_settings
async function getIptvConfig(): Promise<IptvConfig | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "iptv_config")
    .single();

  if (error || !data) return null;
  return data.value as IptvConfig;
}

// Build headers for Stalker middleware requests
function buildHeaders(mac: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
    "Cookie": `mac=${encodeURIComponent(mac)}; stb_lang=en; timezone=UTC`,
    "X-User-Agent": "Model: MAG250; Link: WiFi",
    "Referer": "",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Safe JSON parse from response
async function safeJsonParse(resp: Response, label: string): Promise<any> {
  const text = await resp.text();
  console.log(`[${label}] Status: ${resp.status}, Body preview: ${text.substring(0, 500)}`);
  if (!text || text.trim().length === 0) {
    throw new Error(`${label}: Empty response from portal`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: Invalid JSON response - ${text.substring(0, 200)}`);
  }
}

// Stalker middleware handshake
async function handshake(portalUrl: string, mac: string): Promise<string> {
  const url = `${portalUrl}/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`;
  console.log(`[handshake] Fetching: ${url}`);
  const resp = await fetch(url, { headers: buildHeaders(mac) });
  const data = await safeJsonParse(resp, "handshake");
  return data?.js?.token || "";
}

// Authenticate with portal
async function doAuth(portalUrl: string, mac: string, token: string): Promise<boolean> {
  const url = `${portalUrl}/server/load.php?type=stb&action=do_auth&login=&password=&device_id=&device_id2=&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac, token) });
  const data = await safeJsonParse(resp, "doAuth");
  return !!data?.js;
}

// Get all channels
async function getChannels(portalUrl: string, mac: string, token: string): Promise<any[]> {
  const url = `${portalUrl}/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac, token) });
  const data = await safeJsonParse(resp, "getChannels");
  return data?.js?.data || [];
}

// Get genres/categories
async function getGenres(portalUrl: string, mac: string, token: string): Promise<any[]> {
  const url = `${portalUrl}/server/load.php?type=itv&action=get_genres&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac, token) });
  const data = await safeJsonParse(resp, "getGenres");
  return data?.js || [];
}

// Create stream link
async function createLink(portalUrl: string, mac: string, token: string, cmd: string): Promise<string> {
  const url = `${portalUrl}/server/load.php?type=itv&action=create_link&cmd=${encodeURIComponent(cmd)}&series=&forced_storage=undefined&disable_ad=0&download=0&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac, token) });
  const data = await safeJsonParse(resp, "createLink");
  return data?.js?.cmd || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await getIptvConfig();
    if (!config || !config.portal_url || !config.mac_address) {
      return new Response(JSON.stringify({ error: "IPTV not configured. Please set portal URL and MAC address in admin settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize portal URL - remove trailing slash to avoid double slashes
    const portalUrl = config.portal_url.replace(/\/+$/, "");

    // 1. Handshake to get token
    const token = await handshake(portalUrl, config.mac_address);
    if (!token) {
      return new Response(JSON.stringify({ error: "Failed to authenticate with portal" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Auth (non-fatal - some portals return empty for this)
    try {
      await doAuth(portalUrl, config.mac_address, token);
    } catch (e) {
      console.log("[doAuth] Skipping auth (non-fatal):", e instanceof Error ? e.message : e);
    }

    // Handle different actions
    if (action === "channels") {
      const [channels, genres] = await Promise.all([
        getChannels(portalUrl, config.mac_address, token),
        getGenres(portalUrl, config.mac_address, token),
      ]);

      // Build genre map
      const genreMap = new Map<string, string>();
      genres.forEach((g: any) => {
        genreMap.set(String(g.id), g.title || g.name || "");
      });

      // Map channels to simplified format
      const mapped = channels.map((ch: any) => ({
        id: ch.id || ch.num,
        name: ch.name,
        num: ch.num,
        logo: ch.logo || "",
        cmd: ch.cmd || "",
        genre: genreMap.get(String(ch.tv_genre_id)) || "General",
        censored: ch.censored || 0,
      }));

      return new Response(JSON.stringify({ channels: mapped, genres: Array.from(genreMap.entries()).map(([id, name]) => ({ id, name })) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stream") {
      const cmd = url.searchParams.get("cmd");
      if (!cmd) {
        return new Response(JSON.stringify({ error: "Missing cmd parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const streamCmd = await createLink(portalUrl, config.mac_address, token, cmd);
      
      // Extract actual URL from cmd (format: "ffmpeg http://... ..." or just URL)
      let streamUrl = streamCmd;
      if (streamCmd.startsWith("ffmpeg ")) {
        streamUrl = streamCmd.replace("ffmpeg ", "").split(" ")[0];
      }
      if (streamCmd.startsWith("ffrt ")) {
        streamUrl = streamCmd.replace("ffrt ", "").split(" ")[0];
      }

      return new Response(JSON.stringify({ url: streamUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Proxy action - fetch and proxy an HTTP stream URL
    if (action === "proxy") {
      const streamUrl = url.searchParams.get("url");
      if (!streamUrl) {
        return new Response(JSON.stringify({ error: "Missing url parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(streamUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const body = await response.arrayBuffer();

      // Rewrite m3u8 manifest URLs through proxy
      if (streamUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
        const text = new TextDecoder().decode(body);
        const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
        const proxyBase = `${url.origin}${url.pathname}?action=proxy&url=`;

        const rewritten = text.split("\n").map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const fullUrl = trimmed.startsWith("http") ? trimmed : baseUrl + trimmed;
            return proxyBase + encodeURIComponent(fullUrl);
          }
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
              const fullUri = uri.startsWith("http") ? uri : baseUrl + uri;
              return `URI="${proxyBase}${encodeURIComponent(fullUri)}"`;
            });
          }
          return line;
        }).join("\n");

        return new Response(rewritten, {
          headers: { ...corsHeaders, "Content-Type": "application/vnd.apple.mpegurl" },
        });
      }

      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": contentType },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("IPTV proxy error:", errMessage);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
