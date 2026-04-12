import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedLogoUrl } from '@/components/LivePlayer';

export const useProxyLogo = () => {
  const [proxyUrl, setProxyUrl] = useState<string>('');

  useEffect(() => {
    const fetchProxy = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'iptv_config')
        .maybeSingle();
      
      if (data?.value) {
        const conf = data.value as any;
        setProxyUrl(conf.cloudflare_proxy_url || conf.supabase_proxy_url || '');
      }
    };
    fetchProxy();
  }, []);

  const proxyLogo = (logo?: string) => getProxiedLogoUrl(logo, proxyUrl);

  return { proxyLogo, proxyUrl };
};
