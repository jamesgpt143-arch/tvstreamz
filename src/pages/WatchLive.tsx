import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ShareButton } from '@/components/ShareButton';
import { liveChannels, type Channel } from '@/lib/channels';
import { useChannels, toAppChannel, type DbChannel } from '@/hooks/useChannels';
import { useChannelViews, trackChannelView } from '@/hooks/useChannelViews';
import { ChevronLeft, Radio, WifiOff, Loader2, ArrowUpAZ, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'a-z' | 'popular' | 'recent';

const WatchLive = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  
  const { data: dbChannels, isLoading } = useChannels();
  const { data: viewCounts } = useChannelViews();

  // Create a map of channel creation dates from DB for "recent" sorting
  const dbChannelMap = useMemo(() => {
    const map = new Map<string, DbChannel>();
    (dbChannels || []).forEach(ch => {
      map.set(ch.name.toLowerCase(), ch);
    });
    return map;
  }, [dbChannels]);

  // Merge DB channels with hardcoded channels
  const allChannels: Channel[] = useMemo(() => {
    const dbConverted = (dbChannels || []).map(toAppChannel);
    const dbNames = new Set(dbConverted.map(c => c.name.toLowerCase()));
    
    // Include all DB channels + hardcoded channels that don't exist in DB
    const hardcodedNotInDb = liveChannels.filter(
      c => !dbNames.has(c.name.toLowerCase())
    );
    
    return [...dbConverted, ...hardcodedNotInDb];
  }, [dbChannels]);
  
  const channel = allChannels.find((c) => c.id === channelId);

  // Track channel view
  useEffect(() => {
    if (channel) {
      trackChannelView(channel.id, channel.name);
    }
  }, [channel?.id, channel?.name]);

  // Sort other channels based on selected option
  const sortedOtherChannels = useMemo(() => {
    const others = allChannels.filter((c) => c.id !== channelId);
    
    switch (sortBy) {
      case 'a-z':
        return others.sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        return others.sort((a, b) => {
          const aViews = viewCounts?.[a.id] || 0;
          const bViews = viewCounts?.[b.id] || 0;
          if (bViews !== aViews) return bViews - aViews;
          return a.name.localeCompare(b.name);
        });
      case 'recent':
        return others.sort((a, b) => {
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
        return others;
    }
  }, [allChannels, channelId, viewCounts, dbChannelMap, sortBy]);

  const handleChannelSwitch = useCallback((newChannelId: string) => {
    navigate(`/live/${newChannelId}`, { replace: true });
  }, [navigate]);

  const handleStatusChange = useCallback((online: boolean) => {
    setIsOnline(online);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Channel not found</h1>
          <Button asChild>
            <Link to="/live-tv">Back to Live TV</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      {/* Main Page Scroll */}
      <ScrollArea className="flex-1 pt-16">
        <main className="pb-12">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <div className="py-3">
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link to="/live-tv">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Live TV
                </Link>
              </Button>
            </div>

            {/* Player Section */}
            <div className="max-w-4xl mx-auto w-full">
              {/* Channel Info */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-10 h-10 object-contain rounded-lg bg-secondary p-1.5"
                />
                <div>
                  <h1 className="text-lg font-bold">{channel.name}</h1>
                  <div className="flex items-center gap-2 text-xs">
                    {isOnline ? (
                      <>
                        <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                        <span className="text-green-500">Live Now</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-destructive" />
                        <span className="text-destructive">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Player */}
              <LivePlayer 
                channel={channel} 
                onStatusChange={handleStatusChange}
              />

              {/* Share Button */}
              <div className="flex justify-start mt-3">
                <ShareButton title={`Watch ${channel.name} - Live TV`} />
              </div>
            </div>

            {/* Other Channels - Separate Scrollable Section */}
            {sortedOtherChannels.length > 0 && (
              <div className="mt-6 max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Other Channels</h2>
                  
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-card">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="a-z">
                        <div className="flex items-center gap-2">
                          <ArrowUpAZ className="w-3 h-3" />
                          <span>A-Z</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="popular">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          <span>Popular</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="recent">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Recent</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border border-border rounded-xl bg-card/50 p-3">
                  <ScrollArea className="h-[280px]">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pr-3">
                      {sortedOtherChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChannelSwitch(ch.id)}
                          className="flex flex-col items-center p-2 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                        >
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md bg-secondary/50 p-1"
                          />
                          <p className="font-medium text-[9px] sm:text-[10px] group-hover:text-primary transition-colors text-center mt-1.5 line-clamp-1 w-full">
                            {ch.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default WatchLive;