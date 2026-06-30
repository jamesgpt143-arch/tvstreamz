import { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ShareButton } from '@/components/ShareButton';
import { type Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { useChannelViews, trackChannelView } from '@/hooks/useChannelViews';
import { ChevronLeft, Loader2, Heart, Star, Search, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const WatchLive = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Cignal');
  
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

  // Shopee Popup Logic (Once a day per device)
  useEffect(() => {
    if (channel) {
      const today = new Date().toISOString().split('T')[0];
      const lastPopupDate = localStorage.getItem('last_shopee_popup_date');
      
      if (lastPopupDate !== today) {
        const showPopup = async () => {
          try {
            await Browser.open({ url: 'https://s.shopee.ph/9KcHLNKOwn' });
            localStorage.setItem('last_shopee_popup_date', today);
          } catch (e) {
            console.error('Failed to open Shopee', e);
          }
          // Remove listener after it fires
          document.removeEventListener('click', showPopup);
          document.removeEventListener('touchstart', showPopup);
        };
        
        // Wait for user interaction to avoid popup blockers on Android/iOS
        document.addEventListener('click', showPopup, { once: true });
        document.addEventListener('touchstart', showPopup, { once: true });
        
        return () => {
          document.removeEventListener('click', showPopup);
          document.removeEventListener('touchstart', showPopup);
        };
      }
    }
  }, [channel?.id]);

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
    } else {
      others = others.filter(c => {
        const dbCh = (dbChannels || []).find(d => d.id === c.id);
        const rawCat = (dbCh?.category || '').toLowerCase();
        let cat = 'Other';
        if (rawCat === 'cignal') cat = 'Cignal';
        else if (rawCat === 'converge') cat = 'Converge';
        
        return cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Search Filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      others = others.filter(c => c.name.toLowerCase().includes(query));
    }

    // Default Sort (A-Z)
    return [...others].sort((a, b) => a.name.localeCompare(b.name));
  }, [allChannels, channelId, viewCounts, dbChannels, selectedCategory, myList, searchQuery]);

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
            <Link to="/">Back to Home</Link>
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
                <Link to="/">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Home
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
                  <div className="flex flex-col gap-3 mb-4">
                    <h2 className="text-sm font-semibold hidden lg:block">Other Channels</h2>
                    
                    <div className="flex items-center gap-2 w-full">
                      {/* Category Filter */}
                      <div className="flex-[1.5] lg:flex-none lg:w-[160px]">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full h-10 text-sm bg-card border-white/10 rounded-xl">
                            <SelectValue placeholder="Genre" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-white/10 rounded-xl">
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat} className="cursor-pointer rounded-lg my-0.5">
                                <div className="flex items-center gap-2">
                                  {cat === 'Favorites' ? <Star className="w-4 h-4 text-primary" /> : <div className="w-4" />}
                                  <span>{cat}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Search Box */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search channels..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-card border-white/10 h-10 text-sm rounded-xl w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl bg-black/20 p-2 border border-white/5 flex-1 shadow-inner">
                    <div className="h-[400px] lg:h-[calc(100vh-270px)] lg:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      <div className="flex flex-col gap-1.5">
                        {sortedOtherChannels.map((ch) => {
                          const isFav = isInMyList(ch.id, 'channel');
                          return (
                            <div key={ch.id} className="relative group">
                              <button
                                onClick={() => handleChannelSwitch(ch.id)}
                                className="relative w-full flex items-center justify-center py-4 px-3 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 hover:border-primary/30 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 shadow-sm overflow-hidden"
                              >
                                {/* Left indicator bar */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-r-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 scale-y-50 group-hover:scale-y-100" />
                                
                                <div className="absolute left-4 w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-primary/40 group-hover:bg-primary/20 transition-all duration-300">
                                  <Tv className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                
                                <span className="font-bold text-[14px] text-foreground/80 group-hover:text-foreground text-center truncate px-12 uppercase tracking-[0.1em] transition-colors drop-shadow-md">
                                  {ch.name}
                                </span>
                              </button>
                              <button
                                onClick={(e) => toggleFavorite(ch, e)}
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                  isFav 
                                    ? "text-primary bg-primary/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                                    : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-white/10 hover:scale-110"
                                )}
                              >
                                <Heart className={cn("w-4 h-4", isFav && "fill-current scale-110")} />
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
