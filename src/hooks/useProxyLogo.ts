import { useState, useEffect } from 'react';
import { getIptvConfig } from '@/lib/siteSettings';
import { getProxiedLogoUrl } from '@/components/LivePlayer';

export const useProxyLogo = () => {
  const [proxyUrl, setProxyUrl] = useState<string>('');

  useEffect(() => {
    const fetchProxy = async () => {
      const config = await getIptvConfig();
      if (config) {
        setProxyUrl(config.cloudflare_proxy_url || config.supabase_proxy_url || '');
      }
    };
    fetchProxy();
  }, []);

  const proxyLogo = (logo?: string) => getProxiedLogoUrl(logo, proxyUrl);

  return { proxyLogo, proxyUrl };
};
