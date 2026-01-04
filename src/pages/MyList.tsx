import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Star, ListX } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { getMyList, removeFromMyList, MyListItem } from '@/lib/myList';
import { getImageUrl } from '@/lib/tmdb';

const MyList = () => {
  const [list, setList] = useState<MyListItem[]>([]);

  useEffect(() => {
    setList(getMyList());
  }, []);

  const handleRemove = (id: number, type: 'movie' | 'tv') => {
    removeFromMyList(id, type);
    setList(getMyList());
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
          <h1 className="text-2xl md:text-3xl font-bold">My List</h1>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ListX className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your list is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add movies and TV shows to your list to watch later
            </p>
            <Link to="/">
              <Button>Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {list.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group relative">
                <Link to={`/watch/${item.type}/${item.id}`}>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card">
                    {item.poster_path ? (
                      <img
                        src={getImageUrl(item.poster_path, 'w300')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.vote_average && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            {item.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.type === 'tv' ? 'TV Show' : 'Movie'}
                      </span>
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
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

export default MyList;
