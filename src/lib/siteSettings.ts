import { supabase } from '@/integrations/supabase/client';

let cachedIptvConfig: Record<string, string> | null = null;
let lastConfigFetch = 0;
const CONFIG_TTL = 10 * 60 * 1000; // 10 minutes

export const getIptvConfig = async () => {
  try {
    if (!cachedIptvConfig || (Date.now() - lastConfigFetch > CONFIG_TTL)) {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'iptv_config')
        .single();
      
      if (data?.value) {
        cachedIptvConfig = data.value as Record<string, string>;
        lastConfigFetch = Date.now();
      }
    }
    return cachedIptvConfig;
  } catch (error) {
    console.error('Error fetching IPTV config:', error);
    return cachedIptvConfig; // Return last known good config on error
  }
};
