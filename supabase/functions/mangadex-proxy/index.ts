import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MANGADEX_API = "https://api.mangadex.org";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    const imageUrl = url.searchParams.get("image");

    // Proxy image requests
    if (imageUrl) {
      console.log("Proxying image:", imageUrl);
      
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://mangadex.org/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        console.error("Image fetch failed:", response.status);
        return new Response(null, { status: response.status, headers: corsHeaders });
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      return new Response(imageBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Proxy API requests
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint or image parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the MangaDex URL
    const mangadexUrl = `${MANGADEX_API}${endpoint}`;
    console.log("Proxying request to:", mangadexUrl);

    const response = await fetch(mangadexUrl, {
      method: "GET",
      headers: {
        "User-Agent": "MovieStreamz/1.0",
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
