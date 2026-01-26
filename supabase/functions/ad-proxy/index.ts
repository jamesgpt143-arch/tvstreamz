import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Ad script URLs (decoded from base64)
const adScriptUrls = [
  "https://www.visariomedia.com/bpapaparse.min.css",
  "https://d13k7prax1yi04.cloudfront.net/xAcIl/cchardins.min.js"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const scriptIndex = parseInt(url.searchParams.get('s') || '0');
  
  try {
    if (scriptIndex >= 0 && scriptIndex < adScriptUrls.length) {
      // Fetch the actual ad script
      const response = await fetch(adScriptUrls[scriptIndex], {
        headers: {
          'User-Agent': req.headers.get('User-Agent') || 'Mozilla/5.0',
          'Referer': req.headers.get('Referer') || '',
        }
      });
      
      const content = await response.text();
      const contentType = scriptIndex === 0 ? 'text/css' : 'application/javascript';
      
      return new Response(content, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        }
      });
    }
    
    // Return the main loader script
    const projectUrl = Deno.env.get('SUPABASE_URL') || '';
    const loaderScript = `
(function(){
  var x=window,j="c9b6cb59c84ff56aa7ad154505a16417",m=[["siteId",4983507],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]];
  var v=-1,h,f,k=["${projectUrl}/functions/v1/ad-proxy?s=0","${projectUrl}/functions/v1/ad-proxy?s=1"];
  var l=function(){clearTimeout(f);v++;if(k[v]&&!(1795297669000<(new Date).getTime()&&1<v)){h=x.document.createElement("script");h.type="text/javascript";h.async=!0;var b=x.document.getElementsByTagName("script")[0];h.src=k[v];h.crossOrigin="anonymous";h.onerror=l;h.onload=function(){clearTimeout(f);x[j.slice(0,16)+j.slice(0,16)]||l()};f=setTimeout(l,5E3);b.parentNode.insertBefore(h,b)}};
  if(!x[j]){try{Object.freeze(x[j]=m)}catch(e){}l()}
})();`;

    return new Response(loaderScript, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (error) {
    console.error('Ad proxy error:', error);
    return new Response('', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
      }
    });
  }
});
