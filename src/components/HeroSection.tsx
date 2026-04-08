import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
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
    <section className="relative min-h-[60vh] md:min-h-[75vh] w-full overflow-hidden flex flex-col justify-end">
      {/* Background Image with Watch.tsx style gradients */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out z-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105 animate-pulse-slow"
          style={{
            backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, 'original')})`,
          }}
        />
        {/* Gradients para pumatong nang maayos ang text at mag-blend sa ilalim */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Floating Info & Content - Kamukha ng Watch.tsx Layout */}
      <div className="relative h-full container mx-auto px-4 md:px-12 flex flex-col justify-end pt-32 pb-16 max-w-7xl z-20">
        <div className="max-w-4xl space-y-4 animate-slide-up">
          
          {/* Top Label */}
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Trending Now
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white drop-shadow-2xl leading-tight">
            {title}
          </h1>

          {/* Meta Info (Rating, Year, Type) */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
              <Star className="w-4 h-4 fill-current" />
              {(currentItem.vote_average || 0).toFixed(1)}
            </span>
            {year && <span className="text-zinc-300 drop-shadow-md">{year}</span>}
            <span className="px-3 py-1 rounded bg-primary/20 text-primary text-[10px] uppercase font-black tracking-widest border border-primary/20">
              {mediaType === 'movie' ? 'Feature Film' : 'TV Series'}
            </span>
          </div>

          {/* Overview */}
          <p className="text-zinc-300 leading-relaxed text-sm md:text-base max-w-3xl drop-shadow-lg line-clamp-3">
            {currentItem.overview}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild size="lg" className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Watch Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 bg-zinc-800/40 border-zinc-700/50 backdrop-blur-md hover:bg-zinc-800/60 text-white transition-transform hover:scale-105">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Info className="w-5 h-5 mr-2" />
                More Details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Dots Indicator sa kanan */}
      <div className="absolute bottom-16 right-6 md:right-12 flex flex-col gap-3 z-30">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group relative flex items-center justify-end gap-3"
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 hidden md:block ${index === currentIndex ? 'opacity-100 text-orange-500' : 'opacity-0 text-zinc-500 group-hover:opacity-100'}`}>
               0{index + 1}
            </span>
            <div className={`rounded-full transition-all duration-500 ${
              index === currentIndex
                ? 'w-8 h-1.5 bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'w-2 h-1.5 bg-white/20 hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>
    </section>
  );
};
