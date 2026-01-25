import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, getImageUrl } from '@/lib/tmdb';
import { trackPopAdsClick } from '@/lib/analytics';

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
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, 'original')})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-end pb-24 md:pb-32">
        <div className="max-w-2xl animate-slide-up">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              {currentItem.vote_average.toFixed(1)}
            </span>
            {year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {year}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs uppercase font-medium">
              {mediaType === 'movie' ? 'Movie' : 'TV Series'}
            </span>
          </div>

          <p className="text-muted-foreground mb-6 line-clamp-3 md:line-clamp-4 text-sm md:text-base">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2" onClick={() => trackPopAdsClick('hero_watch_now_button')}>
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 border-border" onClick={() => trackPopAdsClick('hero_more_info_button')}>
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Info className="w-5 h-5" />
                More Info
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'bg-muted-foreground/50 hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
