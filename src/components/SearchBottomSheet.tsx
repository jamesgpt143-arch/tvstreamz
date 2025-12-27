import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, Tv, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchMulti, getImageUrl, Movie } from '@/lib/tmdb';

interface SearchBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBottomSheet = ({ isOpen, onClose }: SearchBottomSheetProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchMulti(query);
        setSuggestions(results.slice(0, 8));
      } catch (error) {
        console.error('Search error:', error);
      }
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (item: Movie) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/watch/${type}/${item.id}`);
    onClose();
    setQuery('');
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
      setSuggestions([]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="pl-10 pr-10 h-12 text-base bg-muted/50 border-0 rounded-xl"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions */}
        <ScrollArea className="max-h-[50vh]">
          <div className="px-4 pb-4 space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {!isLoading && suggestions.length > 0 && (
              suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <img
                    src={getImageUrl(item.poster_path, 'w200')}
                    alt={item.title || item.name}
                    className="w-12 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title || item.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {item.media_type === 'tv' ? (
                          <Tv className="w-3 h-3" />
                        ) : (
                          <Film className="w-3 h-3" />
                        )}
                        {item.media_type === 'tv' ? 'TV' : 'Movie'}
                      </span>
                      <span>•</span>
                      <span>{(item.release_date || item.first_air_date)?.slice(0, 4)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
            
            {!isLoading && query.trim() && suggestions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No results found for "{query}"
              </p>
            )}
            
            {!query.trim() && !isLoading && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Start typing to search...
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};