import { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, TVShow, getImageUrl } from '@/lib/tmdb';
import { Link } from 'react-router-dom';

interface AnimeHeroProps {
  items: (Movie | TVShow)[];
}

export const AnimeHero = ({ items }: AnimeHeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const title = 'title' in current ? current.title : current.name;
  const mediaType = 'title' in current ? 'movie' : 'tv';

  const next = () => setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
  const prev = () => setCurrentIndex((prev) => (prev - 1 + Math.min(items.length, 5)) % Math.min(items.length, 5));

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden rounded-2xl mb-12">
      {/* Background with Fade */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        <img
          src={getImageUrl(current.backdrop_path, 'original')}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-2xl gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
            Trending Now
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {mediaType === 'movie' ? 'Movie' : 'Series'}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold line-clamp-2 leading-tight drop-shadow-2xl text-white">
          {title}
        </h1>
        
        <p className="text-white/80 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-lg mb-4 drop-shadow-lg leading-relaxed">
          {current.overview}
        </p>

        <div className="flex items-center gap-4">
          <Button asChild size="lg" className="rounded-full px-8 gap-2 shadow-lg hover:scale-105 transition-transform">
            <Link to={`/watch/${mediaType}/${current.id}`}>
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-full px-8 gap-2 border-border/50 backdrop-blur-md bg-background/20 hover:bg-background/40">
            <Info className="w-5 h-5" />
            Learn More
          </Button>
        </div>
      </div>

      {/* Nav Buttons */}
      <div className="absolute bottom-12 right-12 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prev} className="rounded-full bg-background/20 backdrop-blur-md border-border/20 hover:bg-primary/20">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={next} className="rounded-full bg-background/20 backdrop-blur-md border-border/20 hover:bg-primary/20">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {items.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
