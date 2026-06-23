import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { type Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { useChannelViews } from '@/hooks/useChannelViews';
import { usePagePopup } from '@/hooks/usePagePopup';
import { Radio, Filter, Star, Trophy, Coffee, Loader2, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORIES, type ChannelCategory } from '@/lib/channelCategories';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SortOption = 'a-z' | 'popular' | 'recent';

const LiveTV = () => {
  const { data: dbChannels, isLoading } = useChannels();
  const { data: viewCounts } = useChannelViews();
  const { myList } = useUserPreferences();
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  usePagePopup('livetv');

  const channels: Channel[] = useMemo(() => {
    let filtered = (dbChannels || []).map(toAppChannel);

    if (selectedCategory === 'Favorites') {
      const favoriteIds = myList
        .filter(item => item.type === 'channel')
        .map(item => String(item.id));
      filtered = filtered.filter(c => favoriteIds.includes(String(c.id)));
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(c => {
        const dbCh = (dbChannels || []).find(d => d.id === c.id);
        const cat = dbCh?.category || 'general';
        return cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    switch (sortBy) {
      case 'a-z':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        return [...filtered].sort((a, b) => {
          const aViews = viewCounts?.[a.id] || 0;
          const bViews = viewCounts?.[b.id] || 0;
          if (bViews !== aViews) return bViews - aViews;
          return a.name.localeCompare(b.name);
        });
      case 'recent':
        return [...filtered].sort((a, b) => {
          const aDb = (dbChannels || []).find(ch => ch.id === a.id);
          const bDb = (dbChannels || []).find(ch => ch.id === b.id);
          if (aDb && bDb) {
            return new Date(bDb.created_at).getTime() - new Date(aDb.created_at).getTime();
          }
          return a.name.localeCompare(b.name);
        });
      default:
        return filtered;
    }
  }, [dbChannels, viewCounts, sortBy, selectedCategory, myList]);

  const getDynamicTitle = () => {
    if (selectedCategory === 'Favorites') return 'My Favorite Channels';
    const prefix = selectedCategory !== 'All' ? `${selectedCategory} ` : '';
    switch (sortBy) {
      case 'popular': return `Trending ${prefix}Channels`;
      case 'recent': return `Newly Added ${prefix}Channels`;
      default: return `${prefix}Live TV Channels`;
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          
          {/* Filters - Desktop */}
          <div className="hidden md:flex flex-wrap items-end gap-6 mb-12 p-6 bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl">
            {/* Sort */}
            <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                <Filter className="w-3 h-3 text-primary" /> Sort
              </label>
              <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
                  <SelectItem value="a-z">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="popular">Most Popuar</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Genre / Category */}
            <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                <Star className="w-3 h-3 text-primary" /> Genre
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat === 'All' ? 'All Channels' : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters - Mobile */}
          <div className="md:hidden flex justify-start mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card/30 backdrop-blur-sm border-border/50 rounded-xl h-11 px-6 shadow-lg">
                  <Filter className="w-4 h-4 text-primary" /> 
                  <span className="font-bold tracking-widest uppercase text-xs">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-3xl border-b-white/10 bg-background/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left font-black tracking-widest uppercase text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" /> Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 pb-8 pt-8">
                  {/* Sort */}
                  <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                      <Filter className="w-3 h-3 text-primary" /> Sort
                    </label>
                    <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                      <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
                        <SelectItem value="a-z">Alphabetical (A-Z)</SelectItem>
                        <SelectItem value="popular">Most Popuar</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Genre / Category */}
                  <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                      <Star className="w-3 h-3 text-primary" /> Genre
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat === 'All' ? 'All Channels' : cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Channels Grid */}
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 min-h-[400px]">
              


              {/* Channel Cards */}
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}

              {channels.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-3xl animate-fade-in">
                  {selectedCategory === 'Favorites' ? (
                    <>
                      <Heart className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-xl font-medium">You haven't added any favorites yet.</p>
                      <p className="text-sm mt-1">Click the heart icon on any channel to add it here!</p>
                      <Button variant="link" onClick={() => setSelectedCategory('All')} className="mt-4 text-primary">Browse All Channels</Button>
                    </>
                  ) : (
                    <>
                      <Radio className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-xl font-medium">No channels found in this category.</p>
                      <Button variant="link" onClick={() => {
                        setSortBy('a-z');
                        setSelectedCategory('All');
                      }} className="mt-2 text-primary">Reset filters</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* About Section */}
          <div className="mt-20 p-8 rounded-[2rem] bg-card/50 backdrop-blur-sm border border-border/50 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Radio className="w-6 h-6 text-destructive" />
              About MovieStreamz Live TV
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <p className="text-muted-foreground leading-relaxed">
                Stream your favorite Filipino and international channels live for free. We aggregate the best available streams to provide you with a seamless viewing experience. 
                Some channels may require specific browser permissions or data-saving modes to be disabled for optimal playback.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <p className="text-sm">High-speed Filipino content integration.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <p className="text-sm">Zero ads on premium sandboxed servers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
