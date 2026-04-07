import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, getImageUrl } from '@/lib/tmdb';

interface HeroSectionProps {
  items: Movie[];
}

export const HeroSection = ({ items }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredItems = items.slice(0, 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  if (!featuredItems.length) return null;

  const currentItem = featuredItems[currentIndex];
  const title = currentItem.title || currentItem.name;
  const date = currentItem.release_date || currentItem.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const mediaType = currentItem.media_type || 'movie';

  return (
    <section className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background Image with Cinematic Masks */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 animate-pulse-slow"
          style={{
            backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, 'original')})`,
            transition: 'background-image 1s ease-in-out',
          }}
        />
        
        {/* Layered Gradient Masks for Depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-black/20 z-0" />
      </div>

      {/* Floating Info & Content */}
      <div className="relative h-full container mx-auto px-6 md:px-12 flex items-center pt-32 pb-44 md:pt-40 md:pb-64 z-20">
        <div className="max-w-3xl pt-0">
          {/* Top Label */}
          <div className="flex items-center gap-3 mb-6 animate-reveal">
            <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Trending Now
            </div>
            {year && (
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {year}
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tighter text-white animate-reveal [animation-delay:200ms]">
            {title}
          </h1>

          <div className="flex items-center gap-6 mb-8 text-sm font-medium animate-reveal [animation-delay:400ms]">
            <div className="flex items-center gap-2 text-yellow-500">
               <Star className="w-5 h-5 fill-yellow-500" />
               <span className="text-lg font-black italic">{(currentItem.vote_average || 0).toFixed(1)}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 text-zinc-300 uppercase tracking-widest text-xs font-black">
               {mediaType === 'movie' ? 'Feature Film' : 'TV Series'}
            </div>
          </div>

          <p className="text-zinc-400 mb-10 line-clamp-3 md:line-clamp-4 text-base md:text-xl leading-relaxed max-w-xl animate-reveal [animation-delay:600ms]">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap gap-4 animate-reveal [animation-delay:800ms]">
            <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:bg-orange-600 text-black font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Play className="w-6 h-6 fill-black group-hover:scale-110 transition-transform" />
                Watch Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-black uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Info className="w-6 h-6" />
                More Details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Dots Indicator */}
      <div className="absolute bottom-12 right-12 flex flex-col gap-4 z-30">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-500 group relative flex items-center justify-end gap-3`}
          >
            <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${index === currentIndex ? 'opacity-100 text-orange-500' : 'opacity-0 text-zinc-500 hover:opacity-100'}`}>
               0{index + 1}
            </span>
            <div className={`rounded-full transition-all duration-500 ${
              index === currentIndex
                ? 'w-12 h-1.5 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                : 'w-3 h-1.5 bg-white/20 hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>
    </section>
  );
};
