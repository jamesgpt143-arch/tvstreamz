import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, Tv, Star, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchMulti, getImageUrl, Movie, TVShow } from '@/lib/tmdb';
import { liveChannels, Channel } from '@/lib/channels';

interface SearchSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = (Movie | TVShow) | { type: 'channel'; channel: Channel };

export const SearchSuggestions = ({ isOpen, onClose }: SearchSuggestionsProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
          // Search TMDB
          const data = await searchMulti(query);
          const tmdbResults = data
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 4) as (Movie | TVShow)[];
          
          // Search Live Channels
          const channelResults = liveChannels
            .filter(channel => 
              channel.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .map(channel => ({ type: 'channel' as const, channel }));
          
          setResults([...channelResults, ...tmdbResults]);
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

  const handleSelect = (item: SearchResult) => {
    if (isChannel(item)) {
      navigate(`/live/${item.channel.id}`);
    } else {
      const tmdbItem = item as Movie | TVShow;
      const mediaType = 'title' in tmdbItem ? 'movie' : 'tv';
      navigate(`/watch/${mediaType}/${tmdbItem.id}`);
    }
    setQuery('');
    setResults([]);
    onClose();
  };

  const isChannel = (item: SearchResult): item is { type: 'channel'; channel: Channel } => {
    return 'type' in item && item.type === 'channel';
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
            placeholder="Search movies, shows, channels..."
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
          {results.map((item) => {
            if (isChannel(item)) {
              return (
                <button
                  key={`channel-${item.channel.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/80 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    <img
                      src={item.channel.logo}
                      alt={item.channel.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.channel.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        Live TV
                      </span>
                    </div>
                  </div>
                </button>
              );
            }
            
            const tmdbItem = item as Movie | TVShow;
            return (
              <button
                key={`${tmdbItem.id}-${'title' in tmdbItem ? 'movie' : 'tv'}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/80 transition-colors text-left"
              >
                <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  {tmdbItem.poster_path ? (
                    <img
                      src={getImageUrl(tmdbItem.poster_path, 'w200')}
                      alt={getTitle(tmdbItem)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {'title' in tmdbItem ? <Film className="w-5 h-5 text-muted-foreground" /> : <Tv className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{getTitle(tmdbItem)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {'title' in tmdbItem ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                      {'title' in tmdbItem ? 'Movie' : 'TV Show'}
                    </span>
                    {getYear(tmdbItem) && <span>• {getYear(tmdbItem)}</span>}
                    {tmdbItem.vote_average > 0 && (
                      <span className="flex items-center gap-0.5">
                        • <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {tmdbItem.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
