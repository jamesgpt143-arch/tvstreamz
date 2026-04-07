import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Play, Clock, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { getContinueWatching, removeFromContinueWatching, ContinueWatchingItem } from '@/lib/continueWatching';
import { getImageUrl } from '@/lib/tmdb';

const ContinueWatching = () => {
  const [list, setList] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    setList(getContinueWatching());
  }, []);

  const handleRemove = (id: number, type: 'movie' | 'tv') => {
    removeFromContinueWatching(id, type);
    setList(getContinueWatching());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-7xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.history.back()}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Continue Watching</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick up where you left off</p>
            </div>
          </div>
          <p className="text-sm font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-lg shadow-primary/5">
            {list.length} Items Remaining
          </p>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-zinc-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto px-6">
              Start watching a movie or TV show, and it will automatically appear here for easy access.
            </p>
            <Link to="/">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20">
                Browse Trending Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group relative bg-zinc-900/60 rounded-3xl overflow-hidden border border-white/5 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
                <Link to={`/watch/${item.type}/${item.id}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-zinc-800">
                    <img
                      src={getImageUrl(item.backdrop_path || item.poster_path || '', 'w500')}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-20 h-20 rounded-full bg-primary/95 flex items-center justify-center shadow-3xl scale-75 group-hover:scale-100 transition-transform duration-300 backdrop-blur-sm">
                        <Play className="w-10 h-10 text-primary-foreground fill-current translate-x-1" />
                      </div>
                    </div>

                    {/* Quick Progress Bar on Image */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-6 flex justify-between items-center">
                    <div className="min-w-0 flex-1 pr-4">
                      <h3 className="text-xl font-bold text-white truncate mb-1.5 leading-none">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold uppercase tracking-widest leading-none">
                        {item.type === 'tv' && (
                          <span className="text-primary truncate border-r border-white/10 pr-3">
                            S{item.season} E{item.episode}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          {Math.round(item.progress)}% Watched
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive hover:text-white border border-white/5"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id, item.type);
                  }}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ContinueWatching;
