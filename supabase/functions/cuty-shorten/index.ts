import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destinationUrl } = await req.json();
    
    if (!destinationUrl) {
      console.error('Missing destinationUrl');
      return new Response(
        JSON.stringify({ error: 'destinationUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('CUTY_API_KEY');
    if (!apiKey) {
      console.error('CUTY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating cuty.io short link for:', destinationUrl);

    // Call cuty.io API
    const cutyUrl = `https://cuty.io/api?api=${apiKey}&url=${encodeURIComponent(destinationUrl)}`;
    const response = await fetch(cutyUrl);
    const result = await response.text();

    console.log('Cuty.io response:', result);

    // cuty.io returns the short URL directly as text on success
    // or an error message on failure
    if (result.startsWith('https://cuty.io/')) {
      return new Response(
        JSON.stringify({ shortUrl: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Cuty.io error:', result);
      return new Response(
        JSON.stringify({ error: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in cuty-shorten:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
