import React from 'react';
import { useUnifiedPlayer } from '@/contexts/UnifiedPlayerContext';
import { LivePlayer } from '@/components/LivePlayer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { getStreamingUrls } from '@/lib/tmdb';

export const UnifiedPlayer = () => {
  const { activeMedia } = useUnifiedPlayer();

  if (!activeMedia) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary" />
          </div>
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">
          Ready for <span className="text-primary not-italic">Broadcast</span>
        </h2>
        <p className="text-zinc-500 max-w-md font-bold uppercase tracking-[0.2em] text-[10px]">
          Open the menu to initiate a stream or search for content.
        </p>
      </div>
    );
  }

  const { type, data, meta } = activeMedia;

  if (type === 'live') {
    return (
      <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <LivePlayer channel={data} />
      </div>
    );
  }

  if (type === 'movie' || type === 'tv') {
    const servers = getStreamingUrls(
      data.id,
      type,
      meta?.season || 1,
      meta?.episode || 1
    );

    return (
      <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
        <VideoPlayer 
          servers={servers} 
          title={data.title || data.name || ''} 
          initialServer={meta?.server}
        />
      </div>
    );
  }

  return null;
};
