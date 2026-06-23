let cachedIptvConfig: Record<string, string> | null = null;
let lastConfigFetch = 0;
const CONFIG_TTL = 10 * 60 * 1000; // 10 minutes

export const getIptvConfig = async () => {
  try {
    if (!cachedIptvConfig || (Date.now() - lastConfigFetch > CONFIG_TTL)) {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.iptv_config) {
          cachedIptvConfig = data.iptv_config as Record<string, string>;
          lastConfigFetch = Date.now();
        }
      }
    }
    return cachedIptvConfig;
  } catch (error) {
    console.error('Error fetching IPTV config:', error);
    return cachedIptvConfig; // Return last known good config on error
  }
};
