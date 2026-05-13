import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Convert DB channel to app channel format
 * May kasama itong 'Safety Check' para sa Deno Proxy
 */
export const toAppChannel = (dbChannel: DbChannel) => {
  // 1. SAFETY CHECK: Tingnan kung ang URL ay manually proxied na sa database
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
    
    // 2. LOGIC: Kung proxied na sa DB URL, i-force ang useProxy sa FALSE 
    // para hindi na dagdagan ng player ng isa pang proxy sa unahan.
    useProxy: isAlreadyProxied ? false : dbChannel.use_proxy,
    
    proxyOrder: dbChannel.proxy_order as any || undefined,
    tvappSlug: dbChannel.tvapp_slug || undefined,
    
    // 3. LOGIC: I-force ang proxyType sa 'none' kung proxied na ang URL.
    proxyType: isAlreadyProxied ? 'none' : (dbChannel.proxy_type || 'none'),
    
    epgId: dbChannel.epg_id || undefined,
    num: dbChannel.channel_num || undefined,
    epgUrl: dbChannel.epg_url || undefined,
  };
};

export function useChannels(includeInactive = false) {
  return useQuery({
    queryKey: ['channels', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('channels')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DbChannel[];
    },
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DbChannel;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: ChannelInput) => {
      const { data, error } = await supabase
        .from('channels')
        .insert(channel)
        .select()
        .single();
      if (error) throw error;
      return data as DbChannel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...channel }: Partial<ChannelInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('channels')
        .update(channel)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbChannel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
