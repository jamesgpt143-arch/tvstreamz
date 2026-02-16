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
    const action = url.searchParams.get('action');

    const headers = {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': apiKey,
    };

    let apiUrl = '';

    if (action === 'details') {
      const videoId = url.searchParams.get('videoId') || '';
      apiUrl = `https://${RAPIDAPI_HOST}/get-videos-info/${encodeURIComponent(videoId)}?response_mode=default`;
    } else if (action === 'quality') {
      const videoId = url.searchParams.get('videoId') || '';
      apiUrl = `https://${RAPIDAPI_HOST}/get_available_quality/${encodeURIComponent(videoId)}?response_mode=default`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use details or quality.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`YouTube API request: ${action}`, apiUrl);

    const response = await fetch(apiUrl, { headers });
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube downloader error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
