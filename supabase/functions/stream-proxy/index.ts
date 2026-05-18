

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, range, referer, origin, x-requested-with, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, if-range, if-modified-since, if-none-match, x-supabase-auth, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Content-Type, Accept-Ranges",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Accept-Ranges": "bytes",
  };
}

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MAX_REDIRECTS = 5;
const STREAM_SECRET = Deno.env.get("STREAM_PROXY_SECRET") || "";

// ─── Token signing/verification ───
async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(STREAM_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// ─── Helpers ───

interface ProxiedResponse extends Response {
  finalUrl?: string;
}

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

  // GEOBLOCK BYPASS: Inject Philippines/India IP Headers to bypass regional restrictions
  const geoIPs = [
    // Philippines
    "112.204.1.10", "120.28.45.1", "49.145.23.5", 
    "180.191.102.3", "203.177.42.8", "210.213.122.5",
    // India
    "103.21.164.1", "103.232.124.1", "103.241.224.1",
    "104.211.231.1", "106.51.72.1", "115.248.114.1"
  ];
  const randomIP = geoIPs[Math.floor(Math.random() * geoIPs.length)];
  
  headers["X-Forwarded-For"] = randomIP;
  headers["X-Real-IP"] = randomIP;
  headers["True-Client-IP"] = randomIP;
  headers["X-Visitor-IP"] = randomIP;
  headers["X-Originating-IP"] = randomIP;
  
  // Route to PH by default unless URL specifies india
  const targetUrl = params.get("url") || "";
  const isIndia = targetUrl.toLowerCase().includes("india");
  headers["CF-IPCountry"] = isIndia ? "IN" : "PH";

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
    // FIX: Save the final URL as a custom property to avoid TypeError from read-only .url redefine
    const proxied = resp as ProxiedResponse;
    proxied.finalUrl = current;
    return proxied;
  }
  const finalResp = await fetch(current, { method, headers }) as ProxiedResponse;
  finalResp.finalUrl = current;
  return finalResp;
}

// ─── Manifest Rewriters ───

function resolveUrl(base: string, relative: string): string {
  if (!relative) return "";
  if (relative.startsWith("http")) return relative;
  try {
    // Standard URL resolution handles /path, path, and ../path correctly
    return new URL(relative, base).toString();
  } catch {
    // Fallback for edge cases
    const separator = base.endsWith("/") || relative.startsWith("/") ? "" : "/";
    return base + separator + relative;
  }
}

async function signSuffix(url: string, exp: string | null): Promise<string> {
  if (!STREAM_SECRET || !exp) return "";
  const sig = await hmacHex(`${url}|${exp}`);
  return `&exp=${exp}&sig=${sig}`;
}

async function rewriteHLS(
  text: string,
  baseUrl: string,
  proxyBase: string,
  extra: string,
  exp: string | null
): Promise<string> {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { out.push(line); continue; }

    if (trimmed.includes('URI="')) {
      let replaced = trimmed;
      const matches = [...trimmed.matchAll(/URI="([^"]+)"/g)];
      for (const m of matches) {
        const full = resolveUrl(baseUrl, m[1]);
        const tok = await signSuffix(full, exp);
        replaced = replaced.replace(m[0], `URI="${proxyBase}${encodeURIComponent(full)}${extra}${tok}"`);
      }
      out.push(replaced);
      continue;
    }

    if (!trimmed.startsWith("#")) {
      const full = resolveUrl(baseUrl, trimmed);
      const tok = await signSuffix(full, exp);
      out.push(proxyBase + encodeURIComponent(full) + extra + tok);
      continue;
    }

    out.push(line);
  }
  return out.join("\n");
}

async function rewriteDASH(
  text: string,
  baseUrl: string,
  proxyBase: string,
  extra: string,
  exp: string | null
): Promise<string> {
  let rewritten = text;

  // Collect BaseURL replacements
  const baseUrlMatches = [...rewritten.matchAll(/<BaseURL>([^<]+)<\/BaseURL>/g)];
  for (const m of baseUrlMatches) {
    const unescapedUrl = m[1].replace(/&amp;/g, "&");
    const full = resolveUrl(baseUrl, unescapedUrl);
    const tok = await signSuffix(full, exp);
    const encoded = encodeURIComponent(full);
    const finalVal = `${proxyBase}${encoded}${extra}${tok}`.replace(/&/g, "&amp;");
    rewritten = rewritten.replace(m[0], `<BaseURL>${finalVal}</BaseURL>`);
  }

  const attrMatches = [...rewritten.matchAll(/(media|initialization|sourceURL|index|href)="([^"]+)"/g)];
  for (const m of attrMatches) {
    const attr = m[1];
    const val = m[2];
    if (val.startsWith("$") || val.length < 2) continue;
    const unescapedVal = val.replace(/&amp;/g, "&");
    const full = resolveUrl(baseUrl, unescapedVal);
    const tok = await signSuffix(full, exp);
    const encoded = encodeURIComponent(full).replace(/%24/g, "$");
    const finalVal = `${proxyBase}${encoded}${extra}${tok}`.replace(/&/g, "&amp;");
    rewritten = rewritten.replace(m[0], `${attr}="${finalVal}"`);
  }

  return rewritten;
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const targetUrl = params.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL and extract original base
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstreamHeaders = buildUpstreamHeaders(req, params);

    // ─── HEAD: Metadata check ───
    if (req.method === "HEAD") {
      const resp = await fetch(targetUrl, { method: "HEAD", headers: upstreamHeaders });
      const headHeaders = new Headers(corsHeaders);
      resp.headers.forEach((v, k) => {
        if (!k.toLowerCase().startsWith("access-control-")) headHeaders.set(k, v);
      });
      return new Response(null, { status: resp.status, headers: headHeaders });
    }

    // ─── POST: DRM License Proxy ───
    if (req.method === "POST") {
      const resp = await fetchWithRedirects(targetUrl, upstreamHeaders, "POST", await req.arrayBuffer());
      return new Response(await resp.arrayBuffer(), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": resp.headers.get("content-type") || "application/octet-stream" },
      });
    }

    // ─── GET: Stream / Manifest Proxy ───
    const response = await fetchWithRedirects(targetUrl, upstreamHeaders, "GET");

    if (!response.ok && response.status !== 206) {
      return new Response(JSON.stringify({ error: `Upstream ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "";
    const isHLS = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL");
    const isDASH = targetUrl.includes(".mpd") || contentType.includes("dash+xml");

    if (isHLS || isDASH) {
      const text = new TextDecoder().decode(await response.arrayBuffer());
      
      // CRITICAL: Ensure baseUrl is derived from the FINAL redirected upstream URL
      // This prevents relative segments from pointing back to the Supabase domain.
      const finalUpstreamUrl = (response as ProxiedResponse).finalUrl || response.url || targetUrl;
      const baseUrl = finalUpstreamUrl.substring(0, finalUpstreamUrl.lastIndexOf("/") + 1);
      
      const proxyBase = `${url.origin}${url.pathname}?url=`;
      const extra = extraParams(params);

      const rewritten = isHLS
        ? rewriteHLS(text, baseUrl, proxyBase, extra)
        : rewriteDASH(text, baseUrl, proxyBase, extra);

      return new Response(rewritten, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": isHLS ? "application/vnd.apple.mpegurl" : "application/dash+xml",
          "Cache-Control": "public, max-age=5",
        },
      });
    }

    // ─── Binary passthrough (segments, etc.) ───
    const respHeaders = new Headers(corsHeaders);
    respHeaders.set("Content-Type", contentType || "application/octet-stream");
    const cr = response.headers.get("content-range");
    if (cr) respHeaders.set("Content-Range", cr);
    respHeaders.set("Cache-Control", "public, max-age=3600");

    const segmentData = await response.arrayBuffer();
    respHeaders.set("Content-Length", segmentData.byteLength.toString());

    return new Response(segmentData, { status: response.status, headers: respHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
