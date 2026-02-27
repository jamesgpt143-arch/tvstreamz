import { useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { CHANNELS, type Channel } from '@/lib/channels';
import { useChannelViews } from '@/hooks/useChannelViews';
import { usePagePopup } from '@/hooks/usePagePopup';
import { Radio, ArrowUpAZ, TrendingUp } from 'lucide-react';
import { CATEGORIES, type ChannelCategory } from '@/lib/channelCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'a-z' | 'popular';

const LiveTV = () => {
  const { data: viewCounts } = useChannelViews();
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('All');
  
  usePagePopup('livetv');

  const channels: Channel[] = useMemo(() => {
    // Filter by category
    const filtered = selectedCategory === 'All'
      ? [...CHANNELS]
      : CHANNELS.filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase());

    // Sort
    switch (sortBy) {
      case 'a-z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        return filtered.sort((a, b) => {
          const aViews = viewCounts?.[a.id] || 0;
          const bViews = viewCounts?.[b.id] || 0;
          if (bViews !== aViews) return bViews - aViews;
          return a.name.localeCompare(b.name);
        });
      default:
        return filtered;
    }
  }, [viewCounts, sortBy, selectedCategory]);

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
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {channels.map((channel) => (
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
