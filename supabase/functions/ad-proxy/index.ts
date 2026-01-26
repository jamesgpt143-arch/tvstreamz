import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch PopAds settings from database
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'popads_settings')
      .single();

    // Default settings
    let siteId = 5259529;
    let minBid = 0;
    let popundersPerIP = "0";
    let delayBetween = 0;
    let defaultFlag = false;
    let defaultPerDay = 0;
    let topmostLayer = "auto";
    let enabled = true;

    // Override with database settings if available
    if (settingsData?.value) {
      const settings = settingsData.value as Record<string, unknown>;
      siteId = (settings.siteId as number) || siteId;
      minBid = (settings.minBid as number) || minBid;
      popundersPerIP = String(settings.popundersPerIP ?? popundersPerIP);
      delayBetween = (settings.delayBetween as number) || delayBetween;
      defaultFlag = (settings.defaultFlag as boolean) ?? defaultFlag;
      defaultPerDay = (settings.defaultPerDay as number) || defaultPerDay;
      topmostLayer = (settings.topmostLayer as string) || topmostLayer;
      enabled = (settings.enabled as boolean) ?? enabled;
    }

    console.info('PopAds settings loaded:', { enabled, siteId });

    // If PopAds is disabled, return empty script
    if (!enabled) {
      return new Response('// PopAds disabled', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Generate PopAds script with updated URLs and siteId calculation
    const adScript = `
(function(){var x=window,h="c9b6cb59c84ff56aa7ad154505a16417",y=[["siteId",${siteId}],["minBid",${minBid}],["popundersPerIP","${popundersPerIP}"],["delayBetween",${delayBetween}],["default",${defaultFlag}],["defaultPerDay",${defaultPerDay}],["topmostLayer","${topmostLayer}"]],e=["d3d3LnZpc2FyaW9tZWRpYS5jb20vaG1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvZklNWC9yZm9yY2UubWluLmpz","d3d3LmpwcWZ5dG96dG8uY29tL2ptbWVudS5jc3M=","d3d3LnViY3dhaGNrdi5jb20vWGRBL2lmb3JjZS5taW4uanM="],j=-1,o,w,p=function(){clearTimeout(w);j++;if(e[j]&&!(1795320888000<(new Date).getTime()&&1<j)){o=x.document.createElement("script");o.type="text/javascript";o.async=!0;var i=x.document.getElementsByTagName("script")[0];o.src="https://"+atob(e[j]);o.crossOrigin="anonymous";o.onerror=p;o.onload=function(){clearTimeout(w);x[h.slice(0,16)+h.slice(0,16)]||p()};w=setTimeout(p,5E3);i.parentNode.insertBefore(o,i)}};if(!x[h]){try{Object.freeze(x[h]=y)}catch(e){}p()}})();
`;

    return new Response(adScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in ad-proxy:', error);
    return new Response('// Error loading ad script', {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
      },
    });
  }
});
