import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MAX_REDIRECTS = 5;

async function fetchWithRedirects(targetUrl: string, headers: Record<string, string>): Promise<Response> {
  let url = targetUrl;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const response = await fetch(url, { headers, redirect: "manual" });
    const location = response.headers.get("location");
    if (location && (response.status >= 300 && response.status < 400)) {
      // Resolve relative redirects
      url = location.startsWith("http") ? location : new URL(location, url).toString();
      continue;
    }
    return response;
  }
  return await fetch(url, { headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    const customUA = url.searchParams.get("ua");
    const customReferer = url.searchParams.get("referer");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build fetch headers
    const fetchHeaders: Record<string, string> = {
      "User-Agent": customUA || DEFAULT_UA,
    };
    if (customReferer) {
      fetchHeaders["Referer"] = customReferer;
      fetchHeaders["Origin"] = new URL(customReferer).origin;
    }

    const response = await fetchWithRedirects(targetUrl, fetchHeaders);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    const isHlsManifest = targetUrl.includes(".m3u8") || contentType.includes("mpegurl");
    const isDashManifest = targetUrl.includes(".mpd") || contentType.includes("dash+xml");

    // Rewrite HLS manifest URLs
    if (isHlsManifest) {
      const text = new TextDecoder().decode(body);
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      
      // Build proxy base with preserved custom headers
      const buildProxyBase = () => {
        const proxyUrl = new URL(`${url.origin}${url.pathname}`);
        if (customUA) proxyUrl.searchParams.set("ua", customUA);
        if (customReferer) proxyUrl.searchParams.set("referer", customReferer);
        return proxyUrl.toString() + "&url=";
      };
      const proxyBase = buildProxyBase();

      const rewritten = text.split("\n").map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          if (trimmed.startsWith("http")) {
            return proxyBase + encodeURIComponent(trimmed);
          } else {
            return proxyBase + encodeURIComponent(baseUrl + trimmed);
          }
        }
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
            if (uri.startsWith("http")) {
              return `URI="${proxyBase}${encodeURIComponent(uri)}"`;
            }
            return `URI="${proxyBase}${encodeURIComponent(baseUrl + uri)}"`;
          });
        }
        return line;
      }).join("\n");

      return new Response(rewritten, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
        },
      });
    }

    // Rewrite DASH manifest URLs (BaseURL and SegmentTemplate)
    if (isDashManifest) {
      const text = new TextDecoder().decode(body);
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      
      const buildProxyPrefix = () => {
        const proxyUrl = new URL(`${url.origin}${url.pathname}`);
        if (customUA) proxyUrl.searchParams.set("ua", customUA);
        if (customReferer) proxyUrl.searchParams.set("referer", customReferer);
        return proxyUrl.toString() + "&url=";
      };
      const proxyPrefix = buildProxyPrefix();

      // Rewrite <BaseURL> elements
      let rewritten = text.replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (_match, innerUrl) => {
        const fullUrl = innerUrl.startsWith("http") ? innerUrl : baseUrl + innerUrl;
        return `<BaseURL>${proxyPrefix}${encodeURIComponent(fullUrl)}</BaseURL>`;
      });

      return new Response(rewritten, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/dash+xml",
        },
      });
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Proxy error:", errMessage);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
