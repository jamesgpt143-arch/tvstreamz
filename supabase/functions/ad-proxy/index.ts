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

  // PopAds configuration - siteId: 5487516
  const popAdsScript = `
(function(){var z=window,h="c9b6cb59c84ff56aa7ad154505a16417",l=[["siteId",431-817+178-413*553+5487516],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],i=["d3d3LnZpc2FyaW9tZWRpYS5jb20veG1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvVGJlR0FZL2lmb3JjZS5taW4uanM=","d3d3LnduanR1a290dmRtd2hrLmNvbS9nbW1lbnUuY3Nz","d3d3Lm10cGp5cGZzbHIuY29tL2MvbWZvcmNlLm1pbi5qcw=="],b=-1,y,x,m=function(){clearTimeout(x);b++;if(i[b]&&!(1795315177000<(new Date).getTime()&&1<b)){y=z.document.createElement("script");y.type="text/javascript";y.async=!0;var p=z.document.getElementsByTagName("script")[0];y.src="https://"+atob(i[b]);y.crossOrigin="anonymous";y.onerror=m;y.onload=function(){clearTimeout(x);z[h.slice(0,16)+h.slice(0,16)]||m()};x=setTimeout(m,5E3);p.parentNode.insertBefore(y,p)}};if(!z[h]){try{Object.freeze(z[h]=l)}catch(e){}m()}})();
`;

  return new Response(popAdsScript, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
});
