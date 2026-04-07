import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Star, ListX, Play, Info, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { getMyList, removeFromMyList, clearMyList, MyListItem } from '@/lib/myList';
import { getImageUrl } from '@/lib/tmdb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MyList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<MyListItem[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setList(getMyList());
  }, []);

  const handleRemove = (id: number, type: 'movie' | 'tv') => {
    removeFromMyList(id, type);
    setList(getMyList());
  };

  const handleClearAll = () => {
    clearMyList();
    setList([]);
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-7xl animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-none">My List</h1>
              <p className="text-sm text-zinc-400 mt-2 flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {list.length} Items Saved to Watch
              </p>
            </div>
          </div>

          {list.length > 0 && (
            <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-6 h-11 border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all gap-2 font-bold group shadow-lg shadow-destructive/5">
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Clear Entire List
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/10 max-w-[400px] rounded-3xl p-6">
                <DialogHeader className="space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/5">
                    <Trash2 className="w-10 h-10 text-destructive" />
                  </div>
                  <DialogTitle className="text-2xl font-bold text-center text-white">Are you sure?</DialogTitle>
                  <DialogDescription className="text-center text-zinc-400 text-base leading-relaxed px-2">
                    This will permanently remove all {list.length} items from your list. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-1 rounded-full h-12 font-bold text-zinc-300 hover:text-white transition-all shadow-xl shadow-black/20">
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <Button 
                    variant="destructive" 
                    onClick={handleClearAll} 
                    className="flex-1 rounded-full h-12 font-bold shadow-xl shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Yes, Clear List
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/40 rounded-[40px] border border-white/5 backdrop-blur-sm px-8 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000" />
            
            <div className="w-28 h-28 rounded-full bg-white/5 flex items-center justify-center mb-10 relative group-hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-slow" />
              <ListX className="w-14 h-14 text-zinc-500 relative z-10" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Your list is looking empty</h2>
            <p className="text-zinc-400 mb-12 max-w-sm mx-auto leading-relaxed text-lg font-medium">
              Start adding movies and TV shows you love. We'll keep them here for you to watch anytime.
            </p>
            <Link to="/">
              <Button size="lg" className="rounded-full px-12 h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-2xl shadow-primary/20 uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 group">
                Find Something to Watch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
            {list.map((item, index) => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="group relative animate-slide-up opacity-0 fill-mode-forwards" 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link to={`/watch/${item.type}/${item.id}`} className="block relative aspect-[2/3] rounded-[32px] overflow-hidden bg-zinc-900 shadow-2xl shadow-black ring-1 ring-white/5 transition-all duration-700 group-hover:ring-primary group-hover:-translate-y-3 group-hover:shadow-primary/20">
                  {item.poster_path ? (
                    <img
                      src={getImageUrl(item.poster_path, 'w500')}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500">
                      <Info className="w-8 h-8 mb-3 opacity-50" />
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-70">No Poster</span>
                    </div>
                  )}
                  
                  {/* Glass Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/95 flex items-center justify-center shadow-3xl scale-75 group-hover:scale-100 transition-all duration-500 backdrop-blur-md">
                        <Play className="w-8 h-8 text-primary-foreground fill-current translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="mt-5 px-3">
                  <h3 className="font-bold text-sm md:text-base text-white truncate group-hover:text-primary transition-colors leading-tight mb-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500 leading-none">
                    {item.vote_average && (
                      <span className="flex items-center gap-1.5 text-yellow-500 border-r border-white/10 pr-2.5">
                        <Star className="w-3 h-3 fill-current" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    )}
                    <span className="text-zinc-600 font-bold">
                      {item.type === 'tv' ? 'TV Series' : 'Movie'}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-destructive hover:text-white border border-white/10 group-hover:translate-z-10 shadow-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id, item.type);
                  }}
                >
                  <X className="w-4.5 h-4.5" />
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

export default MyList;
