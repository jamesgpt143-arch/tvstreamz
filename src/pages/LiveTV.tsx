import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { liveChannels } from '@/lib/channels';
import { Radio } from 'lucide-react';

const LiveTV = () => {
  useEffect(() => {
    window.open('https://s.shopee.ph/8fMAzjQUZz', '_blank');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <Radio className="w-6 h-6 text-destructive animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Live TV</h1>
              <p className="text-muted-foreground">Watch your favorite channels live</p>
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {liveChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>

          {/* Info */}
          <div className="mt-12 p-6 rounded-xl bg-card border border-border">
            <h2 className="font-semibold mb-2">About Live TV</h2>
            <p className="text-sm text-muted-foreground">
              Stream your favorite Filipino channels live. Some channels may require specific browser support for DRM playback. 
              If a channel doesn't load, try using a different browser or the YouTube alternative when available.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
