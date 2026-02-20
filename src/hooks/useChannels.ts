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
}

// Convert DB channel to app channel format (for LivePlayer compatibility)
export const toAppChannel = (dbChannel: DbChannel) => ({
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
  useProxy: dbChannel.use_proxy,
});

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
