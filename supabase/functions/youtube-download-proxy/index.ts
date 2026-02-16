import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    const itag = url.searchParams.get('itag');
    const filename = url.searchParams.get('filename') || 'download.mp4';
    const type = url.searchParams.get('type') || 'video'; // 'video' or 'audio'

    if (!videoId || !itag) {
      return new Response(JSON.stringify({ error: 'Missing videoId or itag parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fresh video details from RapidAPI (URLs will be bound to THIS server's IP)
    const apiUrl = `https://${RAPIDAPI_HOST}/v2/video/details?videoId=${encodeURIComponent(videoId)}`;
    console.log(`Fetching fresh details for video: ${videoId}, itag: ${itag}`);

    const detailsRes = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    });

    const details = await detailsRes.json();
    if (!detailsRes.ok || details.error) {
      return new Response(JSON.stringify({ error: details.error || 'Failed to fetch video details' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the matching format by itag
    const allFormats = [
      ...(details.videos?.items || []),
      ...(details.audios?.items || []),
    ];

    const format = allFormats.find((f: any) => String(f.itag) === String(itag) && f.url);

    if (!format) {
      return new Response(JSON.stringify({ error: 'Format not found or no URL available' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Proxying download: ${filename} (itag: ${itag})`);

    // Now fetch the actual video/audio using the server-bound URL
    const mediaRes = await fetch(format.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
      },
    });

    if (!mediaRes.ok) {
      return new Response(JSON.stringify({ error: `Upstream error: ${mediaRes.status}` }), {
        status: mediaRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = mediaRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = mediaRes.headers.get('content-length');

    const headers: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new Response(mediaRes.body, { headers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Download proxy error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
