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
    let siteId = 5487516;
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

    // Generate PopAds script
    const adScript = `
(function(){var e=window,v="c9b6cb59c84ff56aa7ad154505a16417",a=[["siteId",${siteId}],["minBid",${minBid}],["popundersPerIP","${popundersPerIP}"],["delayBetween",${delayBetween}],["default",${defaultFlag}],["defaultPerDay",${defaultPerDay}],["topmostLayer","${topmostLayer}"]],g=["d3d3LnZpc2FyaW9tZWRpYS5jb20vYm1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvbHgvamZvcmNlLm1pbi5qcw=="],w=-1,t,b,x=function(){clearTimeout(b);w++;if(g[w]&&!(1795314785000<(new Date).getTime()&&1<w)){t=e.document.createElement("script");t.type="text/javascript";t.async=!0;var r=e.document.getElementsByTagName("script")[0];t.src="https://"+atob(g[w]);t.crossOrigin="anonymous";t.onerror=x;t.onload=function(){clearTimeout(b);e[v.slice(0,16)+v.slice(0,16)]||x()};b=setTimeout(x,5E3);r.parentNode.insertBefore(t,r)}};if(!e[v]){try{Object.freeze(e[v]=a)}catch(e){}x()}})();
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
