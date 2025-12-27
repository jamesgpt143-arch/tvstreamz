import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, Tv, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchMulti, getImageUrl, Movie, TVShow } from '@/lib/tmdb';

interface SearchSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchSuggestions = ({ isOpen, onClose }: SearchSuggestionsProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const data = await searchMulti(query);
          const filtered = data
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 6);
          setResults(filtered);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (item: Movie | TVShow) => {
    const mediaType = 'title' in item ? 'movie' : 'tv';
    navigate(`/watch/${mediaType}/${item.id}`);
    setQuery('');
    setResults([]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery('');
      setResults([]);
      onClose();
    }
  };

  const getTitle = (item: Movie | TVShow) => 'title' in item ? item.title : item.name;
  const getYear = (item: Movie | TVShow) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 animate-fade-in">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search movies, shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-48 sm:w-64 bg-secondary border-border pr-8"
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </form>

      {results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
          {results.map((item) => (
            <button
              key={`${item.id}-${'title' in item ? 'movie' : 'tv'}`}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 p-3 hover:bg-secondary/80 transition-colors text-left"
            >
              <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                {item.poster_path ? (
                  <img
                    src={getImageUrl(item.poster_path, 'w200')}
                    alt={getTitle(item)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {'title' in item ? <Film className="w-5 h-5 text-muted-foreground" /> : <Tv className="w-5 h-5 text-muted-foreground" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{getTitle(item)}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {'title' in item ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                    {'title' in item ? 'Movie' : 'TV Show'}
                  </span>
                  {getYear(item) && <span>• {getYear(item)}</span>}
                  {item.vote_average > 0 && (
                    <span className="flex items-center gap-0.5">
                      • <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full p-3 text-center text-sm text-primary hover:bg-secondary/80 transition-colors border-t border-border"
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
};
