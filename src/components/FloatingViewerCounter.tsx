import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Radio } from 'lucide-react';

export const FloatingViewerCounter = () => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Extract channel ID from URL if on live page
  const channelMatch = location.pathname.match(/^\/live\/(.+)$/);
  const currentChannelId = channelMatch ? channelMatch[1] : null;

  useEffect(() => {
    if (!currentChannelId) {
      setIsVisible(false);
      setViewerCount(0);
      return;
    }

    setIsVisible(true);

    // Create a unique user ID for this session
    const sessionId = `viewer_${Math.random().toString(36).substring(2, 15)}`;
    
    const channel = supabase.channel(`viewers:${currentChannelId}`, {
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
            channel_id: currentChannelId,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannelId]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/95 border border-border shadow-lg backdrop-blur-md animate-in slide-in-from-left-5 duration-300">
      {/* Live Indicator */}
      <div className="relative flex items-center justify-center">
        <span className="absolute w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
        <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full" />
      </div>
      
      {/* LIVE Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
        <Radio className="w-3 h-3 text-red-500" />
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
      </div>

      {/* Viewer Count */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="w-4 h-4" />
        <span className="text-sm font-semibold tabular-nums">
          {viewerCount.toLocaleString()}
        </span>
        <span className="text-xs hidden sm:inline">watching</span>
      </div>
    </div>
  );
};
