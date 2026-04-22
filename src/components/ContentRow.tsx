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
    <section className="py-10 group/row animate-reveal relative">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Curated {type === 'movie' ? 'Cinema' : 'Series'}</p>
           </div>
           <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">
             {title.split(' ').map((word, i) => i === 0 ? word + ' ' : <span key={i} className="text-primary not-italic">{word} </span>)}
           </h2>
        </div>
        
        <div className="flex gap-4 opacity-0 group-hover/row:opacity-100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl w-12 h-12 glass-card border-white/5 hover:bg-white/10 transition-all duration-500 active:scale-90 group/btn"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-6 h-6 group-hover/btn:text-primary transition-colors" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl w-12 h-12 glass-card border-white/5 hover:bg-white/10 transition-all duration-500 active:scale-90 group/btn"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-6 h-6 group-hover/btn:text-primary transition-colors" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide pb-12 -mx-4 px-4 md:-mx-12 md:px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <div key={item.id} className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[260px] relative group/card">
            {isTrending && (
              <div className="absolute -left-12 -bottom-6 text-[150px] font-black text-white/5 leading-none select-none pointer-events-none group-hover/card:text-primary/10 transition-all duration-700 italic tracking-tighter z-0">
                {index + 1}
              </div>
            )}
            <div className={`relative z-10 transition-all duration-700 ${isTrending ? "ml-8 group-hover/card:ml-10" : ""}`}>
              <ContentCard item={item} type={type} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
