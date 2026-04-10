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
    <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      {/* Background Image with Cinematic Masks (Matched to Watch Page) */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, 'original')})`,
            transition: 'background-image 1s ease-in-out',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Floating Info & Content (Matched to Watch Page Layout) */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pt-32 pb-12 md:pb-16 max-w-7xl z-20 animate-reveal">
        <div className="max-w-4xl space-y-4">
          
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white drop-shadow-2xl leading-tight">
            {title}
          </h1>

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

          <p className="text-zinc-300 leading-relaxed text-sm md:text-base max-w-2xl drop-shadow-lg line-clamp-3">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-zinc-800/20 border-zinc-700/50 backdrop-blur-md hover:bg-zinc-800/40 text-white gap-2">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Info className="w-4 h-4" />
                More Details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Dots Indicator */}
      <div className="absolute bottom-12 right-12 hidden md:flex flex-col gap-4 z-30">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-500 group relative flex items-center justify-end gap-3`}
          >
            <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${index === currentIndex ? 'opacity-100 text-primary' : 'opacity-0 text-zinc-500 hover:opacity-100'}`}>
               0{index + 1}
            </span>
            <div className={`rounded-full transition-all duration-500 ${
              index === currentIndex
                ? 'w-12 h-1.5 bg-primary shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                : 'w-3 h-1.5 bg-white/20 hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>
    </section>
  );
};
