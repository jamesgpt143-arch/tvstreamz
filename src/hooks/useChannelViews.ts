import { useQuery } from '@tanstack/react-query';

export interface ChannelViewCount {
  channelId: string;
  views: number;
}

// Get view counts for all live channels
export function useChannelViews() {
  return useQuery({
    queryKey: ['channel-views'],
    queryFn: async () => {
      const res = await fetch('/api/analytics?type=live_channel');
      if (!res.ok) throw new Error('Failed to fetch channel views');
      return await res.json() as Record<string, number>;
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

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'content_view',
        page_path: `/live/${channelId}`,
        content_id: channelId,
        content_type: 'live_channel',
        content_title: channelName,
        visitor_id: visitorId,
      })
    });
  } catch (error) {
    console.error('Failed to track channel view:', error);
  }
};
