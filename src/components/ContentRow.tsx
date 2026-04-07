import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentCard } from './ContentCard';
import { Movie, TVShow } from '@/lib/tmdb';

interface ContentRowProps {
  title: string;
  items: (Movie | TVShow)[];
  type?: 'movie' | 'tv';
  isTrending?: boolean;
}

export const ContentRow = ({ title, items, type, isTrending }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items?.length) return null;

  return (
    <section className="py-12 group/row animate-reveal">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-1">
             <div className="h-1 w-12 bg-primary rounded-full mb-2" />
             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">
               {title}
             </h2>
          </div>
          
          <div className="flex gap-3 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 -mx-12 px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px] relative group/card">
              {isTrending && (
                <div className="absolute -left-10 bottom-4 text-[120px] font-black text-white/10 leading-none select-none pointer-events-none group-hover/card:text-primary/20 transition-colors duration-500 italic">
                  {index + 1}
                </div>
              )}
              <div className={isTrending ? "ml-4" : ""}>
                <ContentCard item={item} type={type} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
