import { useNavigate, Link } from 'react-router-dom';
import { Heart, Film, Tv, Star, Trash2, LogIn } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/useWatchlist';
import { getImageUrl } from '@/lib/tmdb';

const Watchlist = () => {
  const navigate = useNavigate();
  const { watchlist, isLoading, user, removeFromWatchlist } = useWatchlist();

  const handleRemove = async (contentId: number, contentType: 'movie' | 'tv', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWatchlist(contentId, contentType);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-24">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Login to View Your Watchlist</h1>
            <p className="text-muted-foreground mb-6">
              Save your favorite movies and TV shows to watch later.
            </p>
            <Link to="/auth">
              <Button className="gap-2">
                <LogIn className="w-4 h-4" />
                Login / Sign Up
              </Button>
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">My Watchlist</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies and TV shows to your watchlist!
            </p>
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/watch/${item.content_type}/${item.content_id}`)}
                className="group relative cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {item.poster_path ? (
                    <img
                      src={getImageUrl(item.poster_path, 'w300')}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.content_type === 'movie' ? (
                        <Film className="w-12 h-12 text-muted-foreground" />
                      ) : (
                        <Tv className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                      {item.content_type === 'movie' ? (
                        <Film className="w-3 h-3" />
                      ) : (
                        <Tv className="w-3 h-3" />
                      )}
                      <span>{item.content_type === 'movie' ? 'Movie' : 'TV Show'}</span>
                      {item.release_date && (
                        <span>• {new Date(item.release_date).getFullYear()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={(e) => handleRemove(item.content_id, item.content_type, e)}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                {/* Rating Badge */}
                {item.vote_average && item.vote_average > 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {Number(item.vote_average).toFixed(1)}
                  </div>
                )}

                {/* Title */}
                <h3 className="mt-2 text-sm font-medium truncate">{item.title}</h3>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Watchlist;
