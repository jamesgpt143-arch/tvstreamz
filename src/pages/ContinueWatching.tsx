import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Play, Clock } from 'lucide-react';
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
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Continue Watching</h1>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nothing to continue</h2>
            <p className="text-muted-foreground mb-6">
              Start watching something and it will appear here
            </p>
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group relative bg-card rounded-lg overflow-hidden">
                <Link to={`/watch/${item.type}/${item.id}`} className="flex gap-3 p-3">
                  <div className="relative w-24 h-36 flex-shrink-0 rounded-md overflow-hidden">
                    {item.poster_path ? (
                      <img
                        src={getImageUrl(item.poster_path, 'w200')}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground text-xs">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 py-1">
                    <h3 className="font-medium line-clamp-2 mb-1">{item.title}</h3>
                    {item.type === 'tv' && item.season && item.episode && (
                      <p className="text-sm text-muted-foreground mb-2">
                        S{item.season} E{item.episode}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">
                      {formatTime(item.currentTime)} / {formatTime(item.duration)}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id, item.type);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
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
