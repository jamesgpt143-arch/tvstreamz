import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RAPIDAPI_HOST = 'youtube-video-fast-downloader-24-7.p.rapidapi.com';

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
    const quality = url.searchParams.get('quality');
    const type = url.searchParams.get('type') || 'video'; // 'video', 'audio', or 'short'
    const filename = url.searchParams.get('filename') || 'download.mp4';

    if (!videoId || !quality) {
      return new Response(JSON.stringify({ error: 'Missing videoId or quality parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the download URL based on type
    let downloadEndpoint = 'download_video';
    if (type === 'audio') downloadEndpoint = 'download_audio';
    if (type === 'short') downloadEndpoint = 'download_short';

    const apiUrl = `https://${RAPIDAPI_HOST}/${downloadEndpoint}/${encodeURIComponent(videoId)}?quality=${encodeURIComponent(quality)}`;
    console.log(`Requesting download URL: ${apiUrl}`);

    const downloadRes = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    });

    const downloadData = await downloadRes.json();
    console.log('Download API response:', JSON.stringify(downloadData));

    if (!downloadRes.ok || downloadData.error) {
      return new Response(JSON.stringify({ error: downloadData.error || 'Failed to get download URL' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // The API returns a file URL - may need 15-30s to be ready
    const fileUrl = downloadData.file || downloadData.url || downloadData.link;

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: 'No download URL returned', data: downloadData }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to fetch the file, with retries (file may take 15-30s to become available)
    let mediaRes: Response | null = null;
    let attempts = 0;
    const maxAttempts = 6; // ~30 seconds total

    while (attempts < maxAttempts) {
      mediaRes = await fetch(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (mediaRes.ok) break;

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`File not ready yet (attempt ${attempts}), waiting 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (!mediaRes || !mediaRes.ok) {
      // Return the direct URL as fallback so frontend can redirect
      return new Response(JSON.stringify({ redirect: fileUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
