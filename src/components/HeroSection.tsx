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
    <section className="relative h-[75vh] md:h-[85vh] w-full overflow-hidden">
      {/* Background Image with Cinematic Parallax & Mesh Overlay */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 animate-[zoom_20s_infinite_alternate]"
          style={{
            backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, 'original')})`,
          }}
        />
        {/* Advanced Cinematic Masks */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-mesh opacity-60 z-10" />
      </div>

      <style>{`
        @keyframes zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>

      {/* Immersive Metadata & Call to Action */}
      <div className="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-end pb-24 md:pb-32 max-w-7xl z-20">
        <div className="max-w-3xl space-y-6 animate-reveal">
          <div className="flex items-center gap-3">
             <div className="h-px w-8 bg-primary shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary drop-shadow-glow-orange">Featured {mediaType === 'movie' ? 'Cinema' : 'Series'}</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter drop-shadow-2xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-[11px] font-black tracking-[0.1em] uppercase">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-yellow-500 border-yellow-500/20">
              <Star className="w-4 h-4 fill-current drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
              {(currentItem.vote_average || 0).toFixed(1)} TMDB
            </span>
            {year && <span className="text-zinc-400 font-medium">{year}</span>}
            <span className="px-4 py-1.5 rounded-full glass-card border-white/5 text-zinc-300">
              {mediaType === 'movie' ? 'Theatrical Release' : 'Global Hit'}
            </span>
          </div>

          <p className="text-zinc-400 leading-relaxed text-base md:text-lg max-w-xl line-clamp-3 font-medium">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild size="lg" className="h-14 rounded-2xl px-10 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest shadow-2xl shadow-primary/30 gap-3 transition-all hover:scale-105 active:scale-95 group">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Play className="w-5 h-5 fill-current" />
                Stream Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl px-10 glass-card-heavy border-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95">
              <Link to={`/watch/${mediaType}/${currentItem.id}`}>
                <Info className="w-5 h-5" />
                Details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* High-End Carousel Indicators */}
      <div className="absolute bottom-12 right-6 md:right-12 flex flex-col gap-5 z-30">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group relative flex items-center justify-end gap-5 transition-all duration-500"
          >
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${index === currentIndex ? 'opacity-100 text-primary translate-x-0' : 'opacity-0 text-zinc-500 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
               SCENE {index + 1}
            </span>
            <div className={`transition-all duration-700 ease-out ${
              index === currentIndex
                ? 'w-16 h-1 bg-primary shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                : 'w-4 h-1 bg-white/10 hover:bg-white/30'
            }`} />
          </button>
        ))}
      </div>
    </section>
  );
};
