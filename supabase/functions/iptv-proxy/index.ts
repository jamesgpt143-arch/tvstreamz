import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface IptvConfig {
  type: "stalker" | "xtream";
  // Stalker fields
  portal_url?: string;
  mac_address?: string;
  // Xtream fields
  server_url?: string;
  username?: string;
  password?: string;
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
  const val = data.value as any;
  // Legacy configs without type default to stalker
  if (!val.type) val.type = "stalker";
  return val as IptvConfig;
}

// ─── Stalker Middleware Helpers ───

function buildHeaders(mac: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
    "Cookie": `mac=${encodeURIComponent(mac)}; stb_lang=en; timezone=UTC`,
    "X-User-Agent": "Model: MAG250; Link: WiFi",
    "Referer": "",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function safeJsonParse(resp: Response, label: string): Promise<any> {
  const text = await resp.text();
  console.log(`[${label}] Status: ${resp.status}, Body preview: ${text.substring(0, 500)}`);
  if (!text || text.trim().length === 0) throw new Error(`${label}: Empty response from portal`);
  try { return JSON.parse(text); } catch { throw new Error(`${label}: Invalid JSON - ${text.substring(0, 200)}`); }
}

async function stalkerHandshake(portalUrl: string, mac: string): Promise<string> {
  const url = `${portalUrl}/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac) });
  const data = await safeJsonParse(resp, "handshake");
  return data?.js?.token || "";
}

async function stalkerAuth(portalUrl: string, mac: string, token: string): Promise<void> {
  const url = `${portalUrl}/server/load.php?type=stb&action=do_auth&login=&password=&device_id=&device_id2=&JsHttpRequest=1-xml`;
  try {
    const resp = await fetch(url, { headers: buildHeaders(mac, token) });
    await safeJsonParse(resp, "doAuth");
  } catch (e) {
    console.log("[doAuth] Skipping (non-fatal):", e instanceof Error ? e.message : e);
  }
}

async function stalkerGetChannels(portalUrl: string, mac: string, token: string): Promise<{ channels: any[]; genres: any[] }> {
  const [chResp, gResp] = await Promise.all([
    fetch(`${portalUrl}/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`, { headers: buildHeaders(mac, token) }),
    fetch(`${portalUrl}/server/load.php?type=itv&action=get_genres&JsHttpRequest=1-xml`, { headers: buildHeaders(mac, token) }),
  ]);
  const chData = await safeJsonParse(chResp, "getChannels");
  const gData = await safeJsonParse(gResp, "getGenres");

  const genreMap = new Map<string, string>();
  (gData?.js || []).forEach((g: any) => genreMap.set(String(g.id), g.title || g.name || ""));

  const channels = (chData?.js?.data || []).map((ch: any) => ({
    id: ch.id || ch.num,
    name: ch.name,
    num: ch.num,
    logo: ch.logo || "",
    cmd: ch.cmd || "",
    genre: genreMap.get(String(ch.tv_genre_id)) || "General",
    censored: ch.censored || 0,
  }));

  const genres = Array.from(genreMap.entries()).map(([id, name]) => ({ id, name }));
  return { channels, genres };
}

async function stalkerCreateLink(portalUrl: string, mac: string, token: string, cmd: string): Promise<string> {
  const url = `${portalUrl}/server/load.php?type=itv&action=create_link&cmd=${encodeURIComponent(cmd)}&series=&forced_storage=undefined&disable_ad=0&download=0&JsHttpRequest=1-xml`;
  const resp = await fetch(url, { headers: buildHeaders(mac, token) });
  const data = await safeJsonParse(resp, "createLink");
  return data?.js?.cmd || "";
}

// ─── Xtream Codes API Helpers ───

async function xtreamGetChannels(serverUrl: string, username: string, password: string): Promise<{ channels: any[]; genres: any[] }> {
  const base = serverUrl.replace(/\/+$/, "");
  const [liveResp, catResp] = await Promise.all([
    fetch(`${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`),
    fetch(`${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`),
  ]);

  const liveData = await safeJsonParse(liveResp, "xtream_live");
  const catData = await safeJsonParse(catResp, "xtream_categories");

  const catMap = new Map<string, string>();
  if (Array.isArray(catData)) {
    catData.forEach((c: any) => catMap.set(String(c.category_id), c.category_name || ""));
  }

  const channels = (Array.isArray(liveData) ? liveData : []).map((ch: any, i: number) => ({
    id: String(ch.stream_id || i),
    name: ch.name || "",
    num: ch.num || i + 1,
    logo: ch.stream_icon || "",
    cmd: String(ch.stream_id || ""),
    genre: catMap.get(String(ch.category_id)) || "General",
    censored: 0,
  }));

  const genres = Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));
  return { channels, genres };
}

function xtreamGetStreamUrl(serverUrl: string, username: string, password: string, streamId: string): string {
  const base = serverUrl.replace(/\/+$/, "");
  return `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.m3u8`;
}

// ─── Proxy Helper ───

async function proxyStream(reqUrl: URL, streamUrl: string): Promise<Response> {
  const response = await fetch(streamUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), {
      status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const body = await response.arrayBuffer();

  if (streamUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
    const text = new TextDecoder().decode(body);
    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
    const proxyBase = `${reqUrl.origin}${reqUrl.pathname}?action=proxy&url=`;

    const rewritten = text.split("\n").map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const fullUrl = trimmed.startsWith("http") ? trimmed : baseUrl + trimmed;
        return proxyBase + encodeURIComponent(fullUrl);
      }
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (_m, uri) => {
          const fullUri = uri.startsWith("http") ? uri : baseUrl + uri;
          return `URI="${proxyBase}${encodeURIComponent(fullUri)}"`;
        });
      }
      return line;
    }).join("\n");

    return new Response(rewritten, { headers: { ...corsHeaders, "Content-Type": "application/vnd.apple.mpegurl" } });
  }

  return new Response(body, { headers: { ...corsHeaders, "Content-Type": contentType } });
}

// ─── Main Handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Proxy action doesn't need config
    if (action === "proxy") {
      const streamUrl = url.searchParams.get("url");
      if (!streamUrl) {
        return new Response(JSON.stringify({ error: "Missing url parameter" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return proxyStream(url, streamUrl);
    }

    const config = await getIptvConfig();
    if (!config) {
      return new Response(JSON.stringify({ error: "IPTV not configured. Set up in admin settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Xtream Codes path ───
    if (config.type === "xtream") {
      if (!config.server_url || !config.username || !config.password) {
        return new Response(JSON.stringify({ error: "Xtream Codes not fully configured." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "channels") {
        const result = await xtreamGetChannels(config.server_url, config.username, config.password);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "stream") {
        const cmd = url.searchParams.get("cmd");
        if (!cmd) return new Response(JSON.stringify({ error: "Missing cmd" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const streamUrl = xtreamGetStreamUrl(config.server_url, config.username, config.password, cmd);
        return new Response(JSON.stringify({ url: streamUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── Stalker path ───
    if (!config.portal_url || !config.mac_address) {
      return new Response(JSON.stringify({ error: "Stalker portal not fully configured." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portalUrl = config.portal_url.replace(/\/+$/, "");
    const token = await stalkerHandshake(portalUrl, config.mac_address);
    if (!token) {
      return new Response(JSON.stringify({ error: "Failed to authenticate with portal" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await stalkerAuth(portalUrl, config.mac_address, token);

    if (action === "channels") {
      const result = await stalkerGetChannels(portalUrl, config.mac_address, token);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "stream") {
      const cmd = url.searchParams.get("cmd");
      if (!cmd) return new Response(JSON.stringify({ error: "Missing cmd" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const streamCmd = await stalkerCreateLink(portalUrl, config.mac_address, token, cmd);
      let streamUrl = streamCmd;
      if (streamCmd.startsWith("ffmpeg ")) streamUrl = streamCmd.replace("ffmpeg ", "").split(" ")[0];
      if (streamCmd.startsWith("ffrt ")) streamUrl = streamCmd.replace("ffrt ", "").split(" ")[0];

      return new Response(JSON.stringify({ url: streamUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("IPTV proxy error:", errMessage);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
