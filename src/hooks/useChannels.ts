import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DbChannel {
  id: string;
  name: string;
  logo_url: string | null;
  stream_url: string;
  stream_type: 'mpd' | 'hls' | 'youtube';
  drm_key_id: string | null;
  drm_key: string | null;
  license_type: 'clearkey' | 'widevine' | null;
  license_url: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number | null;
  user_agent: string | null;
  referrer: string | null;
  use_proxy: boolean;
  proxy_order: string[] | null;
  tvapp_slug: string | null;
  proxy_type: string;
  epg_id: string | null;
  channel_num: string | null;
  epg_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelInput {
  name: string;
  logo_url?: string | null;
  stream_url: string;
  stream_type: 'mpd' | 'hls' | 'youtube';
  drm_key_id?: string | null;
  drm_key?: string | null;
  license_type?: 'clearkey' | 'widevine' | null;
  license_url?: string | null;
  category?: string | null;
  is_active?: boolean;
  sort_order?: number | null;
  user_agent?: string | null;
  referrer?: string | null;
  use_proxy?: boolean;
  proxy_order?: string[] | null;
  tvapp_slug?: string | null;
  proxy_type?: string;
  epg_id?: string | null;
  channel_num?: string | null;
  epg_url?: string | null;
}

// Convert DB channel to app channel format (for LivePlayer compatibility)
export const toAppChannel = (dbChannel: DbChannel) => {
  // SAFETY CHECK: I-check kung ang URL ay dumaan na sa proxy
  const isAlreadyProxied = 
    dbChannel.stream_url.includes('deno.net') || 
    dbChannel.stream_url.includes('workers.dev') || 
    dbChannel.stream_url.includes('corsproxy.io') ||
    dbChannel.stream_url.includes('?url=');

  return {
    id: dbChannel.id,
    name: dbChannel.name,
    manifestUri: dbChannel.stream_url,
    type: dbChannel.stream_type,
    logo: dbChannel.logo_url || '',
    clearKey: dbChannel.license_type === 'clearkey' && dbChannel.drm_key_id && dbChannel.drm_key 
      ? { [dbChannel.drm_key_id]: dbChannel.drm_key } 
      : undefined,
    widevineUrl: dbChannel.license_type === 'widevine' && dbChannel.license_url 
      ? dbChannel.license_url 
      : undefined,
    embedUrl: dbChannel.stream_type === 'youtube' ? dbChannel.stream_url : undefined,
    userAgent: dbChannel.user_agent || undefined,
    referrer: dbChannel.referrer || undefined,
    // Kung proxy na ang URL, i-force natin na HUWAG nang gumamit ng extra proxy layer
    useProxy: isAlreadyProxied ? false : dbChannel.use_proxy,
    proxyOrder: dbChannel.proxy_order as any || undefined,
    tvappSlug: dbChannel.tvapp_slug || undefined,
    proxyType: isAlreadyProxied ? 'none' : (dbChannel.proxy_type || 'none'),
    epgId: dbChannel.epg_id || undefined,
    num: dbChannel.channel_num || undefined,
    epgUrl: dbChannel.epg_url || undefined,
    category: dbChannel.category || undefined,
  };
};

export function useChannels(includeInactive = false) {
  const cacheKey = `tvstreamz_channels_cache_${includeInactive}`;

  return useQuery({
    queryKey: ['channels', includeInactive],
    queryFn: async () => {
      const url = `/api/channels?includeInactive=${includeInactive}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached) as DbChannel[];
        throw new Error('Failed to fetch channels');
      }

      const data = await res.json();

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}

      return data as DbChannel[];
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(`tvstreamz_channels_cache_${includeInactive}`);
        if (cached) return JSON.parse(cached) as DbChannel[];
      } catch {}
      return undefined;
    },
    initialDataUpdatedAt: () => {
      return localStorage.getItem(`tvstreamz_channels_cache_${includeInactive}`) ? 0 : undefined;
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: async () => {
      const res = await fetch(`/api/channels`);
      if (!res.ok) throw new Error('Failed to fetch channels');
      const channels = await res.json() as DbChannel[];
      const channel = channels.find(c => c.id === id);
      if (!channel) throw new Error('Channel not found');
      return channel;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: ChannelInput) => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel)
      });
      if (!res.ok) throw new Error('Failed to create channel');
      const data = await res.json();
      return { id: data.id, ...channel } as unknown as DbChannel;
    },
    onSuccess: () => {
      localStorage.removeItem('tvstreamz_channels_cache_true');
      localStorage.removeItem('tvstreamz_channels_cache_false');
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...channel }: Partial<ChannelInput> & { id: string }) => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...channel })
      });
      if (!res.ok) throw new Error('Failed to update channel');
      return { id, ...channel } as unknown as DbChannel;
    },
    onSuccess: () => {
      localStorage.removeItem('tvstreamz_channels_cache_true');
      localStorage.removeItem('tvstreamz_channels_cache_false');
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete channel');
    },
    onSuccess: () => {
      localStorage.removeItem('tvstreamz_channels_cache_true');
      localStorage.removeItem('tvstreamz_channels_cache_false');
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
