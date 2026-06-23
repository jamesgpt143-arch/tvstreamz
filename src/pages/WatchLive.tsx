import { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ShareButton } from '@/components/ShareButton';
import { type Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { useChannelViews, trackChannelView } from '@/hooks/useChannelViews';
import { ChevronLeft, Loader2, ArrowUpAZ, TrendingUp, Clock, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useProxyLogo } from '@/hooks/useProxyLogo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/channelCategories';
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
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { data: dbChannels, isLoading } = useChannels();
  const { data: viewCounts } = useChannelViews();
  const { isInMyList, addToMyList, removeFromMyList, myList, isLoading: isPrefsLoading } = useUserPreferences();
  const { proxyLogo } = useProxyLogo();

  // All channels from database
  const allChannels: Channel[] = useMemo(() => {
    return (dbChannels || []).map(toAppChannel);
  }, [dbChannels]);

  const channel = useMemo(() => {
    return allChannels.find((c) => c.id.toLowerCase() === channelId?.toLowerCase());
  }, [allChannels, channelId]);

  // Track channel view
  useEffect(() => {
    if (channel) {
      trackChannelView(channel.id, channel.name);
    }
  }, [channel?.id, channel?.name]);

  const isFavorite = channel ? isInMyList(channel.id, 'channel') : false;

  const toggleFavorite = (targetChannel: Channel, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isInMyList(targetChannel.id, 'channel')) {
      removeFromMyList(targetChannel.id, 'channel');
      toast.success(`${targetChannel.name} removed from favorites`);
    } else {
      addToMyList({
        id: targetChannel.id,
        type: 'channel',
        title: targetChannel.name,
        poster_path: targetChannel.logo,
      });
      toast.success(`${targetChannel.name} added to favorites`);
    }
  };

  // Sort and Filter other channels based on selected options
  const sortedOtherChannels = useMemo(() => {
    let others = allChannels.filter((c) => c.id !== channelId);
    
    // Category Filtering
    if (selectedCategory === 'Favorites') {
      const favoriteIds = myList
        .filter(item => item.type === 'channel')
        .map(item => String(item.id));
      others = others.filter(c => favoriteIds.includes(String(c.id)));
    } else if (selectedCategory !== 'All') {
      others = others.filter(c => {
        const dbCh = (dbChannels || []).find(d => d.id === c.id);
        const cat = dbCh?.category || 'general';
        return cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    switch (sortBy) {
      case 'a-z':
        return [...others].sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        return [...others].sort((a, b) => {
          const aViews = viewCounts?.[a.id] || 0;
          const bViews = viewCounts?.[b.id] || 0;
          if (bViews !== aViews) return bViews - aViews;
          return a.name.localeCompare(b.name);
        });
      case 'recent':
        return [...others].sort((a, b) => {
          const aDb = (dbChannels || []).find(ch => ch.id === a.id);
          const bDb = (dbChannels || []).find(ch => ch.id === b.id);
          if (aDb && bDb) {
            return new Date(bDb.created_at).getTime() - new Date(aDb.created_at).getTime();
          }
          return a.name.localeCompare(b.name);
        });
      default:
        return others;
    }
  }, [allChannels, channelId, viewCounts, dbChannels, sortBy, selectedCategory, myList]);

  const handleChannelSwitch = useCallback((newChannelId: string) => {
    navigate(`/live/${newChannelId}`, { replace: true });
  }, [navigate]);

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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Navbar />

      {/* Main Page Scroll */}
      <div className="flex-1 pt-16 overflow-y-auto overflow-x-hidden custom-scrollbar">
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

            {/* Split Layout */}
            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
              
              {/* Left Column: Player Section */}
              <div className="flex-1 w-full min-w-0">
                {/* Channel Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={proxyLogo(channel.logo)}
                      alt={channel.name}
                      className="w-10 h-10 object-contain rounded-lg bg-secondary p-1.5"
                    />
                    <div>
                      <h1 className="text-lg font-bold">{channel.name}</h1>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => toggleFavorite(channel, e)}
                    className={cn(
                      "rounded-full transition-all duration-300 h-10 w-10",
                      isFavorite 
                        ? "text-primary bg-primary/10 hover:bg-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFavorite && "fill-current scale-110")} />
                  </Button>
                </div>

                {/* Player */}
                <LivePlayer 
                  channel={channel}
                />

                {/* Share Button */}
                <div className="flex justify-start mt-3">
                  <ShareButton title={`Watch ${channel.name} - Live TV`} />
                </div>
              </div>

              {/* Right Column: Other Channels */}
              {allChannels.length > 1 && (
                <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col">
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-start justify-between gap-3 mb-3">
                    <h2 className="text-sm font-semibold">Other Channels</h2>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      {/* Category Filter */}
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[140px] lg:flex-1 h-8 text-xs bg-card">
                          <SelectValue placeholder="Genre" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              <div className="flex items-center gap-2">
                                {cat === 'Favorites' ? <Star className="w-3 h-3 text-primary" /> : <div className="w-3" />}
                                <span>{cat === 'All' ? 'All Channels' : cat}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Sort Dropdown */}
                      <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                        <SelectTrigger className="w-[120px] lg:flex-1 h-8 text-xs bg-card">
                          <SelectValue placeholder="Sort" />
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
                  </div>
                  
                  <div className="rounded-xl bg-muted/30 dark:bg-card/30 p-2 shadow-inner border-2 border-primary/20 dark:border-primary/30 flex-1">
                    <div className="h-[400px] lg:h-[calc(100vh-280px)] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col gap-2 pr-2">
                        {sortedOtherChannels.map((ch) => {
                          const isFav = isInMyList(ch.id, 'channel');
                          return (
                            <div key={ch.id} className="relative group">
                              <button
                                onClick={() => handleChannelSwitch(ch.id)}
                                className="w-full flex items-center p-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.1)] border border-white/10 transition-all duration-300 overflow-hidden relative"
                              >
                                <div className="relative shrink-0 z-10">
                                  <div className="w-14 h-14 rounded-xl bg-black/40 shadow-inner border border-white/10 flex items-center justify-center p-2 overflow-hidden relative">
                                    <img
                                      src={proxyLogo(ch.logo)}
                                      alt={ch.name}
                                      className="w-full h-full object-contain drop-shadow-sm"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2 pr-8 z-10">
                                  <p className="font-black text-[15px] uppercase tracking-wide text-foreground/90 text-center truncate w-full drop-shadow-sm">
                                    {ch.name}
                                  </p>
                                </div>
                              </button>
                              <button
                                onClick={(e) => toggleFavorite(ch, e)}
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                                  isFav 
                                    ? "bg-primary/20 text-primary shadow-sm" 
                                    : "bg-background/80 backdrop-blur-md text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-background hover:scale-110"
                                )}
                              >
                                <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                              </button>
                            </div>
                          );
                        })}

                        {sortedOtherChannels.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            {selectedCategory === 'Favorites' ? (
                              <>
                                <Heart className="w-8 h-8 mb-2 text-muted-foreground opacity-20" />
                                <p className="text-xs text-muted-foreground">No other favorites found.</p>
                                <Button variant="link" size="sm" onClick={() => setSelectedCategory('All')} className="text-primary text-[10px] mt-1">
                                  Browse All Channels
                                </Button>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">No channels found in this category.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WatchLive;
