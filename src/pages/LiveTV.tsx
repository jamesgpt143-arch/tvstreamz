import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { liveChannels, type Channel } from '@/lib/channels';
import { useChannels, toAppChannel, type DbChannel } from '@/hooks/useChannels';
import { Radio, ArrowUpAZ, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'a-z' | 'popular' | 'recent';

const LiveTV = () => {
  const { data: dbChannels, isLoading } = useChannels();
  const [sortBy, setSortBy] = useState<SortOption>('a-z');

  useEffect(() => {
    window.open('https://s.shopee.ph/4AtlxG0ock', '_blank');
  }, []);

  // Create a map of channel creation dates from DB for "recent" sorting
  const dbChannelMap = useMemo(() => {
    const map = new Map<string, DbChannel>();
    (dbChannels || []).forEach(ch => {
      map.set(ch.name.toLowerCase(), ch);
    });
    return map;
  }, [dbChannels]);

  // Merge DB channels with hardcoded channels
  const channels: Channel[] = useMemo(() => {
    const dbConverted = (dbChannels || []).map(toAppChannel);
    const dbNames = new Set(dbConverted.map(c => c.name.toLowerCase()));
    
    // Include all DB channels + hardcoded channels that don't exist in DB
    const hardcodedNotInDb = liveChannels.filter(
      c => !dbNames.has(c.name.toLowerCase())
    );
    
    const combined = [...dbConverted, ...hardcodedNotInDb];

    // Sort based on selected option
    switch (sortBy) {
      case 'a-z':
        return combined.sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        // DB channels first (assumed popular), then hardcoded by sort_order
        return combined.sort((a, b) => {
          const aInDb = dbNames.has(a.name.toLowerCase());
          const bInDb = dbNames.has(b.name.toLowerCase());
          if (aInDb && !bInDb) return -1;
          if (!aInDb && bInDb) return 1;
          // Both in DB or both hardcoded - sort by sort_order or name
          const aDb = dbChannelMap.get(a.name.toLowerCase());
          const bDb = dbChannelMap.get(b.name.toLowerCase());
          if (aDb && bDb) {
            return (aDb.sort_order ?? 999) - (bDb.sort_order ?? 999);
          }
          return a.name.localeCompare(b.name);
        });
      case 'recent':
        // Sort by created_at descending (newest first), hardcoded at end
        return combined.sort((a, b) => {
          const aDb = dbChannelMap.get(a.name.toLowerCase());
          const bDb = dbChannelMap.get(b.name.toLowerCase());
          if (aDb && bDb) {
            return new Date(bDb.created_at).getTime() - new Date(aDb.created_at).getTime();
          }
          if (aDb && !bDb) return -1;
          if (!aDb && bDb) return 1;
          return a.name.localeCompare(b.name);
        });
      default:
        return combined;
    }
  }, [dbChannels, dbChannelMap, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <Radio className="w-6 h-6 text-destructive animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Live TV</h1>
                <p className="text-muted-foreground">Watch your favorite channels live</p>
              </div>
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="a-z">
                  <div className="flex items-center gap-2">
                    <ArrowUpAZ className="w-4 h-4" />
                    <span>A-Z</span>
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Popular</span>
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Recent Added</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
