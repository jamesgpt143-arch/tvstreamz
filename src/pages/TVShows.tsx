import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { fetchPopularTV, discoverContent, TVShow, TV_GENRES } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, Calendar, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const TVShows = () => {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [year, setYear] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('0');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  const fetchShows = async (p: number) => {
    setIsLoading(true);
    try {
      const data = await discoverContent('tv', {
        page: p,
        genre: selectedGenre === 'all' ? undefined : Number(selectedGenre),
        year: year === 'all' ? undefined : Number(year),
        minRating: minRating === '0' ? undefined : Number(minRating),
        sortBy: sortBy,
      }) as TVShow[];
      
      setShows(p === 1 ? data : [...shows, ...data]);
    } catch (error) {
      console.error('Failed to fetch TV shows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setShows([]);
    setPage(1);
    fetchShows(1);
  }, [sortBy, selectedGenre, year, minRating]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchShows(nextPage);
  };

  const getDynamicTitle = () => {
    const genreName = TV_GENRES.find(g => g.id.toString() === selectedGenre)?.name;
    const prefix = genreName ? `${genreName} ` : '';
    
    if (year !== 'all') {
      return `${prefix}TV Shows from ${year}`;
    }

    switch (sortBy) {
      case 'first_air_date.desc': return `Latest ${prefix}TV Shows`;
      case 'vote_average.desc': return `Top Rated ${prefix}TV Shows`;
      case 'first_air_date.asc': return `Classic ${prefix}TV Shows`;
      default: return `Popular ${prefix}TV Shows`;
    }
  };

  const renderFilters = () => (
    <>
      {/* Sort */}
      <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Filter className="w-3 h-3 text-primary" /> Sort
        </label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
            <SelectItem value="popularity.desc">Most Popular</SelectItem>
            <SelectItem value="first_air_date.desc">Newest First</SelectItem>
            <SelectItem value="first_air_date.asc">Oldest First</SelectItem>
            <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Genre */}
      <div className="space-y-2.5 min-w-[160px] flex-1 sm:flex-none">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Star className="w-3 h-3 text-primary" /> Genre
        </label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
            <SelectItem value="all">All Genres</SelectItem>
            {TV_GENRES.map(g => (
              <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div className="space-y-2.5 min-w-[140px] flex-1 sm:flex-none">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Calendar className="w-3 h-3 text-primary" /> Year
        </label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Rating */}
      <div className="space-y-2.5 min-w-[140px] flex-1 sm:flex-none">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Star className="w-3 h-3 text-primary" /> Min Rating
        </label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="w-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors h-11 rounded-xl">
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
            <SelectItem value="0">All Ratings</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(r => (
              <SelectItem key={r} value={r.toString()}>{r}+ Stars</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-20 lg:pt-8 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          
          {/* Filters - Desktop */}
          <div className="hidden md:flex flex-wrap items-end gap-6 mb-12 p-6 bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl">
            {renderFilters()}
          </div>

          {/* Filters - Mobile */}
          <div className="md:hidden flex justify-start mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card/30 backdrop-blur-sm border-border/50 rounded-xl h-11 px-6 shadow-lg">
                  <Filter className="w-4 h-4 text-primary" /> 
                  <span className="font-bold tracking-widest uppercase text-xs">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-3xl border-b-white/10 bg-background/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left font-black tracking-widest uppercase text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" /> Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 pb-8 pt-8">
                  {renderFilters()}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Shows Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {shows.map((show) => (
              <ContentCard key={show.id} item={show} type="tv" />
            ))}
          </div>

          {/* Loading / Load More */}
          <div className="flex justify-center mt-16">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Fetching latest shows...</p>
              </div>
            ) : shows.length > 0 ? (
              <Button 
                variant="outline" 
                onClick={loadMore} 
                className="rounded-full px-12 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-lg hover:shadow-primary/10"
              >
                Load More Content
              </Button>
            ) : (
              <div className="text-center py-20 opacity-50">
                <p className="text-xl">No TV shows found matching your filters.</p>
                <Button variant="link" onClick={() => {
                  setSortBy('popularity.desc');
                  setSelectedGenre('all');
                  setYear('all');
                  setMinRating('0');
                }} className="mt-2">Reset all filters</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TVShows;
