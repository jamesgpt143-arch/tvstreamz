import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { fetchAnimeList, AnimeItem, getAnimeGenres } from '@/lib/anime-db';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, Search, Star, Tv, SortAsc, SortDesc } from 'lucide-react';
import { usePagePopup } from '@/hooks/usePagePopup';
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

  const [items, setItems] = useState<AnimeItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('ranking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [genres, setGenres] = useState<string[]>([]);

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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAnime = async (p: number, isNew = false) => {
    setIsLoading(true);
    try {
      const response = await fetchAnimeList(
        p, 
        20, 
        debouncedSearch, 
        selectedGenre === 'all' ? '' : selectedGenre,
        sortBy,
        sortOrder
      );
      
      setItems(isNew ? response.data : [...items, ...response.data]);
      setTotalPages(response.meta.totalPage);
    } catch (error) {
      console.error('Failed to fetch anime:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAnime(1, true);
  }, [debouncedSearch, sortBy, sortOrder, selectedGenre]);

  const loadMore = () => {
    if (page < totalPages) {
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

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
              <Input 
                placeholder="Search anime titles..." 
                className="pl-12 h-14 bg-card/50 border-white/5 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-lg font-medium shadow-2xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

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
                  <SelectItem value="ranking">Ranking</SelectItem>
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
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {items.map((item) => (
              <ContentCard key={item._id} item={item} type="anime" />
            ))}
          </div>

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
            ) : page < totalPages ? (
              <Button 
                variant="outline" 
                onClick={loadMore} 
                className="rounded-full px-16 h-14 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all shadow-2xl font-black uppercase tracking-[0.2em] text-xs group"
              >
                Load More <Filter className="w-3 h-3 ml-2 group-hover:rotate-180 transition-transform duration-500" />
              </Button>
            ) : items.length === 0 ? (
              <div className="text-center py-20 bg-card/20 rounded-[3rem] border border-dashed border-white/10 w-full max-w-2xl mx-auto">
                <Tv className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                <p className="text-2xl font-bold mb-4">No anime found matching your filters.</p>
                <Button variant="link" onClick={() => {
                  setSearch('');
                  setSortBy('ranking');
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
