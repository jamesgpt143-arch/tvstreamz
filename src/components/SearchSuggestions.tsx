import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Film, Tv, Star, Radio } from 'lucide-react';
import { searchMulti, getImageUrl, Movie, TVShow } from '@/lib/tmdb';
import { Channel } from '@/lib/channels';
import { useChannels, toAppChannel } from '@/hooks/useChannels';

type SearchResult = (Movie | TVShow) | { type: 'channel'; channel: Channel };

export const HeaderSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: dbChannels } = useChannels();
  const liveChannels = (dbChannels || []).map(toAppChannel);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const data = await searchMulti(query);
          const tmdbResults = data
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 4) as (Movie | TVShow)[];
          
          const channelResults = liveChannels
            .filter(channel => 
              channel.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 2)
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
    setIsFocused(false);
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
      setIsFocused(false);
    }
  };

  const getTitle = (item: Movie | TVShow) => 'title' in item ? item.title : item.name;
  const getYear = (item: Movie | TVShow) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  return (
    <div ref={containerRef} className="relative hidden md:block z-[100]">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search titles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="bg-card border border-white/5 rounded-full py-2 pl-11 pr-10 text-sm focus:outline-none focus:border-white/20 w-64 lg:w-80 text-zinc-300 transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {isFocused && results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {results.map((item) => {
            if (isChannel(item)) {
              return (
                <button
                  key={`channel-${item.channel.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center p-1 border border-white/10">
                    <img
                      src={item.channel.logo}
                      alt={item.channel.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{item.channel.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1 text-red-400 font-bold uppercase">
                        <Radio className="w-2.5 h-2.5" />
                        Live
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
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5">
                  {tmdbItem.poster_path ? (
                    <img
                      src={getImageUrl(tmdbItem.poster_path, 'w200')}
                      alt={getTitle(tmdbItem)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {'title' in tmdbItem ? <Film className="w-4 h-4 text-zinc-600" /> : <Tv className="w-4 h-4 text-zinc-600" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{getTitle(tmdbItem)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                    <span className="flex items-center gap-1 font-medium bg-white/5 px-1.5 py-0.5 rounded">
                      {'title' in tmdbItem ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                      {'title' in tmdbItem ? 'Movie' : 'TV'}
                    </span>
                    {getYear(tmdbItem) && <span>{getYear(tmdbItem)}</span>}
                    {tmdbItem.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                        <Star className="w-2.5 h-2.5 fill-current" />
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
            className="w-full p-3 text-center text-xs font-bold text-primary hover:bg-white/5 transition-colors bg-black/20"
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
};
