import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelViewCount {
  channelId: string;
  views: number;
}

// Get view counts for all live channels
export function useChannelViews() {
  return useQuery({
    queryKey: ['channel-views'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_analytics')
        .select('content_id')
        .eq('content_type', 'live_channel')
        .not('content_id', 'is', null);

      if (error) throw error;

      // Count views per channel
      const viewCounts: Record<string, number> = {};
      data?.forEach(item => {
        if (item.content_id) {
          viewCounts[item.content_id] = (viewCounts[item.content_id] || 0) + 1;
        }
      });

      return viewCounts;
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

// Track a channel view
export const trackChannelView = async (channelId: string, channelName: string) => {
  try {
    const visitorId = localStorage.getItem('tvstreamz_visitor_id') || crypto.randomUUID();
    if (!localStorage.getItem('tvstreamz_visitor_id')) {
      localStorage.setItem('tvstreamz_visitor_id', visitorId);
    }

    await supabase.from('site_analytics').insert({
      event_type: 'content_view',
      page_path: `/live/${channelId}`,
      content_id: channelId,
      content_type: 'live_channel',
      content_title: channelName,
      visitor_id: visitorId,
    });
  } catch (error) {
    console.error('Failed to track channel view:', error);
  }
};
