import { useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { liveChannels, type Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { Radio, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LiveTV = () => {
  const { data: dbChannels, isLoading } = useChannels();

  useEffect(() => {
    window.open('https://s.shopee.ph/4AtlxG0ock', '_blank');
  }, []);

  // Merge DB channels with hardcoded channels (DB channels take priority by name)
  const channels: Channel[] = useMemo(() => {
    const dbConverted = (dbChannels || []).map(toAppChannel);
    const dbNames = new Set(dbConverted.map(c => c.name.toLowerCase()));
    
    // Include all DB channels + hardcoded channels that don't exist in DB
    const hardcodedNotInDb = liveChannels.filter(
      c => !dbNames.has(c.name.toLowerCase())
    );
    
    return [...dbConverted, ...hardcodedNotInDb];
  }, [dbChannels]);

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
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          )}

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
