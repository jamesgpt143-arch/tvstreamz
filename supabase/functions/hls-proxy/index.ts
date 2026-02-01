import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the HLS manifest or segment
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    // For m3u8 manifests, rewrite URLs to go through the proxy
    if (targetUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
      const text = new TextDecoder().decode(body);
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const proxyBase = `${url.origin}${url.pathname}?url=`;

      // Rewrite relative URLs in the manifest
      const rewritten = text.split("\n").map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          // It's a URL line
          if (trimmed.startsWith("http")) {
            return proxyBase + encodeURIComponent(trimmed);
          } else {
            return proxyBase + encodeURIComponent(baseUrl + trimmed);
          }
        }
        // For URI= attributes in EXT-X-KEY tags
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
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
