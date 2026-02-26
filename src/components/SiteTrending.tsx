import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchMovieDetails, fetchTVDetails, getImageUrl, MovieDetails } from '@/lib/tmdb';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrendingItem {
  content_id: string;
  content_type: string;
  content_title: string;
  view_count: number;
  details?: MovieDetails;
}

export const SiteTrending = () => {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        // Get most viewed content from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('site_analytics')
          .select('content_id, content_type, content_title')
          .eq('event_type', 'page_view')
          .not('content_id', 'is', null)
          .not('content_type', 'is', null)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (error || !data) return;

        // Aggregate views by content_id
        const viewMap = new Map<string, TrendingItem>();
        for (const row of data) {
          if (!row.content_id || !row.content_type) continue;
          const key = `${row.content_type}-${row.content_id}`;
          const existing = viewMap.get(key);
          if (existing) {
            existing.view_count++;
          } else {
            viewMap.set(key, {
              content_id: row.content_id,
              content_type: row.content_type,
              content_title: row.content_title || 'Unknown',
              view_count: 1,
            });
          }
        }

        // Sort by views and take top 15
        const sorted = Array.from(viewMap.values())
          .sort((a, b) => b.view_count - a.view_count)
          .slice(0, 15);

        // Fetch TMDB details for each
        const withDetails = await Promise.all(
          sorted.map(async (item) => {
            try {
              const id = parseInt(item.content_id);
              if (isNaN(id)) return item;
              const details = item.content_type === 'movie'
                ? await fetchMovieDetails(id)
                : await fetchTVDetails(id);
              return { ...item, details };
            } catch {
              return item;
            }
          })
        );

        setItems(withDetails.filter(i => i.details?.poster_path));
      } catch (err) {
        console.error('Failed to load site trending:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrending();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading || items.length === 0) return null;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold">
              Trending on Our Site
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-secondary"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-secondary"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <Link
              key={`${item.content_type}-${item.content_id}`}
              to={`/watch/${item.content_type}/${item.content_id}`}
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] group"
            >
              <div className="relative overflow-hidden rounded-lg card-hover">
                {/* Rank badge */}
                <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>

                {/* View count badge */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm">
                  <Eye className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-foreground">
                    {item.view_count}
                  </span>
                </div>

                <img
                  src={getImageUrl(item.details?.poster_path || null, 'w300')}
                  alt={item.details?.title || item.details?.name || item.content_title}
                  className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />

                {/* Rating */}
                {item.details?.vote_average ? (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <span className="text-xs font-bold text-primary">
                      ⭐ {item.details.vote_average.toFixed(1)}
                    </span>
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {item.details?.title || item.details?.name || item.content_title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
