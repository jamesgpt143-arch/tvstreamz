import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { fetchAnimeList, AnimeItem, getAnimeGenres, searchAnimeDropdown, AnimeDropdownResult } from '@/lib/anime-db';
import { fetchNewAnimeEpisodes, Movie, TVShow } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, Search, Star, Tv, SortAsc, SortDesc, TvIcon } from 'lucide-react';
import { usePagePopup } from '@/hooks/usePagePopup';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const Anime = () => {
  usePagePopup('anime');
  const navigate = useNavigate();

  const [items, setItems] = useState<AnimeItem[]>([]);
  const [latestReleases, setLatestReleases] = useState<(Movie | TVShow)[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLatestLoading, setIsLatestLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('ranking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [genres, setGenres] = useState<string[]>([]);
  
  // Dropdown States
  const [dropdownResults, setDropdownResults] = useState<AnimeDropdownResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await getAnimeGenres();
        setGenres(data);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    loadGenres();

    const loadLatest = async () => {
      setIsLatestLoading(true);
      try {
        const data = await fetchNewAnimeEpisodes(1);
        setLatestReleases(data.slice(0, 12));
      } catch (error) {
        console.error('Failed to fetch latest anime:', error);
      } finally {
        setIsLatestLoading(false);
      }
    };
    loadLatest();
  }, []);

  // Dropdown trigger
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setIsDropdownLoading(true);
        setIsDropdownOpen(true);
        try {
          const results = await searchAnimeDropdown(search);
          setDropdownResults(results);
        } catch (error) {
          console.error(error);
        } finally {
          setIsDropdownLoading(false);
        }
      } else {
        setDropdownResults([]);
        setIsDropdownOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Enter key to trigger main grid search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsDropdownOpen(false);
      setDebouncedSearch(search);
    }
  };

  const fetchAnime = async (p: number, isNew = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAnimeList(
        p, 
        24, 
        debouncedSearch, 
        selectedGenre,
        sortBy,
        sortOrder
      );
      
      setItems(isNew ? response.data : [...items, ...response.data]);
      setHasNextPage(response.pagination.has_next_page);
    } catch (error: any) {
      console.error('Failed to fetch anime:', error);
      setError(error.message || "Failed to fetch anime catalog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAnime(1, true);
  }, [debouncedSearch, sortBy, sortOrder, selectedGenre]);

  const loadMore = () => {
    if (hasNextPage && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAnime(nextPage);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                EXPLORE <span className="text-orange-500">ANIME</span>
              </h1>
              <p className="text-muted-foreground font-medium tracking-wide flex items-center gap-2">
                <Tv className="w-4 h-4 text-orange-500" /> Discover the best of Japanese animation
              </p>
            </div>

            <div ref={searchContainerRef} className="relative w-full md:w-96 group z-50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
              <Input 
                placeholder="Search anime titles... (Press Enter)" 
                className="pl-12 h-14 bg-card/50 border-white/5 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-lg font-medium shadow-2xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (search.trim().length >= 2) setIsDropdownOpen(true); }}
              />
              {isDropdownLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {/* Dropdown Suggestions */}
              {isDropdownOpen && dropdownResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                  {dropdownResults.map((item) => (
                    <button
                      key={item.mal_id}
                      onClick={() => navigate(`/watch/anime/${item.mal_id}`)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><TvIcon className="w-5 h-5 text-zinc-600" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                          {item.format && <span className="text-orange-500">{item.format}</span>}
                          {item.year && <span>• {item.year}</span>}
                          {item.score && (
                            <span className="flex items-center gap-0.5">
                              • <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {(item.score / 10).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setDebouncedSearch(search);
                    }}
                    className="w-full p-3 text-center text-[10px] font-black tracking-[0.2em] uppercase text-orange-500 hover:bg-white/5 transition-colors bg-white/[0.02]"
                  >
                    View All Results
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Latest Releases Section */}
          {latestReleases.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2 h-8 bg-orange-500 rounded-full" />
                  Latest Releases
                </h2>
                <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                  Updated Today
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                {latestReleases.map((item) => (
                  <div key={item.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                    <ContentCard item={item} type="tv" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-12 p-4 bg-card/20 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl overflow-x-auto no-scrollbar">
            {/* Sort */}
            <div className="flex items-center gap-3 min-w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] bg-background/50 border-white/5 hover:bg-white/5 transition-colors h-11 rounded-xl font-bold text-xs uppercase tracking-widest">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/5 bg-popover/95 backdrop-blur-md">
                  <SelectItem value="rank">Ranking</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-11 w-11 rounded-xl bg-background/50 border border-white/5 hover:bg-orange-500 hover:text-black transition-all"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            <div className="w-px h-6 bg-white/10 hidden md:block" />

            {/* Genre */}
            <div className="flex items-center gap-3 min-w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Genre</span>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px] bg-background/50 border-white/5 hover:bg-white/5 transition-colors h-11 rounded-xl font-bold text-xs uppercase tracking-widest">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/5 bg-popover/95 backdrop-blur-md max-h-80">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Grid */}
          {error ? (
            <div className="text-center py-20 bg-destructive/10 rounded-[3rem] border border-destructive/20 w-full max-w-2xl mx-auto">
              <Tv className="w-16 h-16 text-destructive mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6 px-8">{error}</p>
              <Button 
                onClick={() => fetchAnime(1, true)}
                className="bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
              {items.map((item) => (
                <ContentCard key={item._id} item={item} type="anime" />
              ))}
            </div>
          )}

          {/* Loading / Load More */}
          <div className="flex justify-center mt-20">
            {isLoading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                  <Tv className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">Syncing catalog...</p>
              </div>
            ) : hasNextPage ? (
              <Button 
                variant="outline" 
                onClick={loadMore} 
                className="rounded-full px-16 h-14 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all shadow-2xl font-black uppercase tracking-[0.2em] text-xs group"
              >
                Load More <Filter className="w-3 h-3 ml-2 group-hover:rotate-180 transition-transform duration-500" />
              </Button>
            ) : items.length === 0 && !isLoading ? (
              <div className="text-center py-20 bg-card/20 rounded-[3rem] border border-dashed border-white/10 w-full max-w-2xl mx-auto">
                <Tv className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                <p className="text-2xl font-bold mb-4">No anime found matching your filters.</p>
                <Button variant="link" onClick={() => {
                  setSearch('');
                  setSortBy('rank');
                  setSortOrder('asc');
                  setSelectedGenre('all');
                }} className="text-orange-500 font-bold uppercase tracking-widest">Reset all filters</Button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Anime;
