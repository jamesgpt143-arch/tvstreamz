import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // This endpoint is no longer used for PopAds
  // PopAds script is now directly in index.html
  return new Response('// Ad proxy disabled - using direct script in index.html', {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
    }
  });
});
