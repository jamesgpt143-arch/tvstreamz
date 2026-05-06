import { useState, useEffect } from 'react';
import { fetchTrendingAnimeBanner, AnimeHeroItem } from '@/lib/anime-db';
import { Play, Star, Info, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const AnimeHeroBanner = () => {
  const [items, setItems] = useState<AnimeHeroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBanner = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTrendingAnimeBanner();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch anime banner:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBanner();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    
    // Auto-advance banner every 10 seconds if no video is playing, or if it errored
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setVideoError(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] md:h-[80vh] bg-zinc-900 animate-pulse flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  
  // Clean description: limit length
  const description = currentItem.description.length > 250 
    ? currentItem.description.substring(0, 250) + '...' 
    : currentItem.description;

  return (
    <div className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden bg-black group">
      {/* Background Image / Video Layer */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        {currentItem.trailerId && !videoError ? (
          <div className="relative w-full h-full scale-125 md:scale-110 pointer-events-none">
            <iframe
              src={`https://www.youtube.com/embed/${currentItem.trailerId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${currentItem.trailerId}&modestbranding=1&playsinline=1`}
              title="Anime Trailer"
              className="absolute inset-0 w-full h-full object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onError={() => setVideoError(true)}
            />
          </div>
        ) : (
          <img
            src={currentItem.bannerImage || currentItem.coverImage}
            alt={currentItem.title}
            className="w-full h-full object-cover opacity-60 animate-pan-image"
          />
        )}
      </div>

      {/* Gradients for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-full md:w-[70%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 container mx-auto px-6 md:px-12 flex flex-col justify-end pb-16 md:pb-24 z-10">
        <div className="max-w-3xl space-y-4 md:space-y-6 animate-slide-up">
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded bg-orange-500 text-black text-[10px] uppercase font-black tracking-widest shadow-lg shadow-orange-500/20">
              #{(currentIndex + 1)} Trending
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              {currentItem.score.toFixed(1)}
            </span>
            {currentItem.year && (
              <span className="text-zinc-300 font-bold text-sm drop-shadow-md">{currentItem.year}</span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl leading-[1.1] tracking-tight">
            {currentItem.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {currentItem.genres.slice(0, 4).map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-300 font-bold uppercase tracking-wider backdrop-blur-sm"
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed drop-shadow-lg line-clamp-3 md:line-clamp-none">
            {description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate(`/watch/anime/${currentItem.mal_id}`)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-6 font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2 fill-black" />
              Watch Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(`/watch/anime/${currentItem.mal_id}`)}
              className="rounded-full px-8 py-6 font-black uppercase tracking-widest border-white/20 bg-black/40 backdrop-blur-md hover:bg-white/10 text-white transition-all"
            >
              <Info className="w-5 h-5 mr-2" />
              Details
            </Button>
          </div>
        </div>
      </div>

      {/* Mute/Unmute Toggle & Indicators */}
      <div className="absolute bottom-16 right-6 md:right-12 z-20 flex flex-col items-end gap-6">
        {currentItem.trailerId && !videoError && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        
        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setVideoError(false);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex ? 'w-8 bg-orange-500' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pan-image {
          0% { transform: scale(1.05) translate(0, 0); }
          50% { transform: scale(1.1) translate(-1%, 1%); }
          100% { transform: scale(1.05) translate(0, 0); }
        }
        .animate-pan-image {
          animation: pan-image 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
