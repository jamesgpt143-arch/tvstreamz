import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface PopAdsSettings {
  enabled: boolean;
  siteId: number;
  minBid: number;
  popundersPerIP: string;
  delayBetween: number;
  defaultPerDay: number;
  topmostLayer: string;
}

const defaultSettings: PopAdsSettings = {
  enabled: true,
  siteId: 5487516,
  minBid: 0,
  popundersPerIP: "0",
  delayBetween: 0,
  defaultPerDay: 0,
  topmostLayer: "auto",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch settings from database
    let settings: PopAdsSettings = defaultSettings;
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'popads_settings')
      .single();

    if (!error && data?.value) {
      settings = { ...defaultSettings, ...(data.value as PopAdsSettings) };
    }

    console.log('PopAds settings loaded:', { enabled: settings.enabled, siteId: settings.siteId });

    // If ads are disabled, return empty script
    if (!settings.enabled) {
      return new Response('// PopAds disabled by admin', {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
    }

    // Generate PopAds script with dynamic settings
    // The siteId calculation is obfuscated to prevent easy identification
    const obfuscatedSiteId = `431-817+178-413*553+${settings.siteId}`;
    
    const popAdsScript = `
(function(){var z=window,h="c9b6cb59c84ff56aa7ad154505a16417",l=[["siteId",${obfuscatedSiteId}],["minBid",${settings.minBid}],["popundersPerIP","${settings.popundersPerIP}"],["delayBetween",${settings.delayBetween}],["default",false],["defaultPerDay",${settings.defaultPerDay}],["topmostLayer","${settings.topmostLayer}"]],i=["d3d3LnZpc2FyaW9tZWRpYS5jb20veG1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvVGJlR0FZL2lmb3JjZS5taW4uanM=","d3d3LnduanR1a290dmRtd2hrLmNvbS9nbW1lbnUuY3Nz","d3d3Lm10cGp5cGZzbHIuY29tL2MvbWZvcmNlLm1pbi5qcw=="],b=-1,y,x,m=function(){clearTimeout(x);b++;if(i[b]&&!(1795315177000<(new Date).getTime()&&1<b)){y=z.document.createElement("script");y.type="text/javascript";y.async=!0;var p=z.document.getElementsByTagName("script")[0];y.src="https://"+atob(i[b]);y.crossOrigin="anonymous";y.onerror=m;y.onload=function(){clearTimeout(x);z[h.slice(0,16)+h.slice(0,16)]||m()};x=setTimeout(m,5E3);p.parentNode.insertBefore(y,p)}};if(!z[h]){try{Object.freeze(z[h]=l)}catch(e){}m()}})();
`;

    return new Response(popAdsScript, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error in ad-proxy:', error);
    
    // Fallback to default script on error
    const fallbackScript = `
(function(){var z=window,h="c9b6cb59c84ff56aa7ad154505a16417",l=[["siteId",431-817+178-413*553+5487516],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],i=["d3d3LnZpc2FyaW9tZWRpYS5jb20veG1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvVGJlR0FZL2lmb3JjZS5taW4uanM=","d3d3LnduanR1a290dmRtd2hrLmNvbS9nbW1lbnUuY3Nz","d3d3Lm10cGp5cGZzbHIuY29tL2MvbWZvcmNlLm1pbi5qcw=="],b=-1,y,x,m=function(){clearTimeout(x);b++;if(i[b]&&!(1795315177000<(new Date).getTime()&&1<b)){y=z.document.createElement("script");y.type="text/javascript";y.async=!0;var p=z.document.getElementsByTagName("script")[0];y.src="https://"+atob(i[b]);y.crossOrigin="anonymous";y.onerror=m;y.onload=function(){clearTimeout(x);z[h.slice(0,16)+h.slice(0,16)]||m()};x=setTimeout(m,5E3);p.parentNode.insertBefore(y,p)}};if(!z[h]){try{Object.freeze(z[h]=l)}catch(e){}m()}})();
`;

    return new Response(fallbackScript, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
});
