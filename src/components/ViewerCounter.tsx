import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface ViewerCounterProps {
  channelId: string;
}

export const ViewerCounter = ({ channelId }: ViewerCounterProps) => {
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    // Create a unique user ID for this session
    const sessionId = `viewer_${Math.random().toString(36).substring(2, 15)}`;
    
    const channel = supabase.channel(`viewers:${channelId}`, {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            channel_id: channelId,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
        <span className="relative w-2 h-2 bg-green-500 rounded-full" />
      </div>
      <Users className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-semibold text-primary">
        {viewerCount.toLocaleString()} watching
      </span>
    </div>
  );
};
