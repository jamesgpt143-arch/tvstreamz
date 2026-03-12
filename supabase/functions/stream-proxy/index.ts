import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type",
};

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MAX_REDIRECTS = 5;

// ─── Helpers ───

function buildUpstreamHeaders(
  req: Request,
  params: URLSearchParams
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": params.get("ua") || DEFAULT_UA,
  };

  const referer = params.get("referer");
  if (referer) {
    headers["Referer"] = referer;
    try {
      headers["Origin"] = new URL(referer).origin;
    } catch { /* ignore */ }
  }

  const cookie = params.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const auth = params.get("auth");
  if (auth) headers["Authorization"] = auth;

  // Forward Range header from client (for video segment byte-range requests)
  const range = req.headers.get("Range");
  if (range) headers["Range"] = range;

  return headers;
}

/** Carry forward proxy params (ua, referer, cookie, auth) into rewritten URLs */
function extraParams(params: URLSearchParams): string {
  let extra = "";
  for (const key of ["ua", "referer", "cookie", "auth"]) {
    const val = params.get(key);
    if (val) extra += `&${key}=${encodeURIComponent(val)}`;
  }
  return extra;
}

async function fetchWithRedirects(
  url: string,
  headers: Record<string, string>,
  method = "GET",
  body?: ArrayBuffer | null
): Promise<Response> {
  let current = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const init: RequestInit = { method, headers, redirect: "manual" };
    // Only attach body on first request (redirects typically become GET)
    if (i === 0 && body && method === "POST") {
      init.body = body;
    }
    const resp = await fetch(current, init);
    const location = resp.headers.get("location");
    if (location && resp.status >= 300 && resp.status < 400) {
      current = location.startsWith("http")
        ? location
        : new URL(location, current).toString();
      continue;
    }
    return resp;
  }
  return await fetch(current, { method, headers });
}

// ─── Manifest Rewriters ───

function rewriteHLS(
  text: string,
  baseUrl: string,
  proxyBase: string,
  extra: string
): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      // URI= in EXT-X-KEY, EXT-X-MAP etc.
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (_m, uri) => {
          const full = uri.startsWith("http") ? uri : baseUrl + uri;
          return `URI="${proxyBase}${encodeURIComponent(full)}${extra}"`;
        });
      }

      // Non-comment, non-empty = segment/playlist URL
      if (trimmed && !trimmed.startsWith("#")) {
        const full = trimmed.startsWith("http") ? trimmed : baseUrl + trimmed;
        return proxyBase + encodeURIComponent(full) + extra;
      }

      return line;
    })
    .join("\n");
}

function rewriteDASH(
  text: string,
  baseUrl: string,
  proxyBase: string,
  extra: string
): string {
  let rewritten = text;

  // <BaseURL>...</BaseURL>
  rewritten = rewritten.replace(
    /<BaseURL>([^<]+)<\/BaseURL>/g,
    (_m, innerUrl) => {
      const full = innerUrl.startsWith("http") ? innerUrl : baseUrl + innerUrl;
      return `<BaseURL>${proxyBase}${encodeURIComponent(full)}${extra}</BaseURL>`;
    }
  );

  // media="..." and initialization="..." (skip $-templates)
  rewritten = rewritten.replace(
    /(media|initialization)="([^"]+)"/g,
    (match, attr, val) => {
      if (val.includes("$")) return match; // template
      const full = val.startsWith("http") ? val : baseUrl + val;
      return `${attr}="${proxyBase}${encodeURIComponent(full)}${extra}"`;
    }
  );

  return rewritten;
}

// ─── Main Handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const targetUrl = params.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing 'url' parameter",
          usage: {
            GET_stream:
              "?url=<encoded_url>&ua=<optional>&referer=<optional>&cookie=<optional>&auth=<optional>",
            POST_drm:
              "?url=<license_server_url>&ua=<optional>&referer=<optional>&auth=<optional>  (body = DRM challenge)",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstreamHeaders = buildUpstreamHeaders(req, params);

    // ─── POST: DRM License Proxy ───
    if (req.method === "POST") {
      const reqBody = await req.arrayBuffer();

      // Forward content-type from client (usually application/octet-stream for Widevine)
      const clientCT = req.headers.get("content-type");
      if (clientCT) upstreamHeaders["Content-Type"] = clientCT;

      console.log(`[DRM] POST ${targetUrl} (${reqBody.byteLength} bytes)`);

      const resp = await fetchWithRedirects(
        targetUrl,
        upstreamHeaders,
        "POST",
        reqBody
      );

      const respBody = await resp.arrayBuffer();
      const respCT =
        resp.headers.get("content-type") || "application/octet-stream";

      return new Response(respBody, {
        status: resp.status,
        headers: {
          ...corsHeaders,
          "Content-Type": respCT,
        },
      });
    }

    // ─── GET: Stream / Manifest Proxy ───
    console.log(`[GET] ${targetUrl}`);

    const response = await fetchWithRedirects(
      targetUrl,
      upstreamHeaders,
      "GET"
    );

    if (!response.ok && response.status !== 206) {
      const errText = await response.text().catch(() => "");
      console.error(`[upstream] ${response.status}: ${errText.substring(0, 300)}`);
      return new Response(
        JSON.stringify({ error: `Upstream ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    const isHLS =
      targetUrl.includes(".m3u8") || contentType.includes("mpegurl");
    const isDASH =
      targetUrl.includes(".mpd") || contentType.includes("dash+xml");

    if (isHLS || isDASH) {
      const text = new TextDecoder().decode(body);
      const baseUrl =
        targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      // Build public proxy base URL
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const projectRef = supabaseUrl.match(/\/\/([^.]+)\./)?.[1] || "";
      const publicProxyOrigin = projectRef 
        ? `https://${projectRef}.supabase.co`
        : url.origin;
      const proxyBase = `${publicProxyOrigin}/functions/v1/stream-proxy?url=`;
      const extra = extraParams(params);

      const rewritten = isHLS
        ? rewriteHLS(text, baseUrl, proxyBase, extra)
        : rewriteDASH(text, baseUrl, proxyBase, extra);

      return new Response(rewritten, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": isHLS
            ? "application/vnd.apple.mpegurl"
            : "application/dash+xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ─── Binary passthrough (segments, keys, etc.) ───
    const respHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
    };

    const cl = response.headers.get("content-length");
    if (cl) respHeaders["Content-Length"] = cl;

    const cr = response.headers.get("content-range");
    if (cr) respHeaders["Content-Range"] = cr;

    return new Response(body, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[stream-proxy] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
