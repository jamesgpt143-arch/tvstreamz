import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { getContinueWatching, removeFromContinueWatching, ContinueWatchingItem } from '@/lib/continueWatching';
import { getImageUrl } from '@/lib/tmdb';
import { Button } from './ui/button';

export const ContinueWatchingRow = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    setItems(getContinueWatching());
  }, []);

  const handleRemove = (id: number, type: 'movie' | 'tv') => {
    removeFromContinueWatching(id, type);
    setItems(getContinueWatching());
  };

  if (items.length === 0) return null;

  return (
    <section className="py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Continue Watching
          </h2>
          <Link to="/continue-watching" className="text-primary text-sm font-medium hover:underline">
            View All
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="group relative flex-shrink-0 w-[240px] md:w-[300px]">
              <Link to={`/watch/${item.type}/${item.id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-lg group-hover:ring-2 group-hover:ring-primary transition-all">
                <img
                  src={getImageUrl(item.backdrop_path || item.poster_path || '', 'w500')}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Progress Bar Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="flex justify-between items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate drop-shadow-md">
                        {item.title}
                      </h3>
                      {item.type === 'tv' && (
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                          S{item.season} E{item.episode}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                    </div>
                  </div>
                  
                  {/* The actual progress bar */}
                  <div className="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(item.id, item.type);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
