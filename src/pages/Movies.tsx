import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { fetchPopularMovies, discoverContent, Movie, MOVIE_GENRES } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, Calendar, Star, ChevronDown } from 'lucide-react';
import { usePagePopup } from '@/hooks/usePagePopup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Movies = () => {
  usePagePopup('movies');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [year, setYear] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('0');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  const fetchMovies = async (p: number) => {
    setIsLoading(true);
    try {
      const data = await discoverContent('movie', {
        page: p,
        genre: selectedGenre === 'all' ? undefined : Number(selectedGenre),
        year: year === 'all' ? undefined : Number(year),
        minRating: minRating === '0' ? undefined : Number(minRating),
        sortBy: sortBy,
      }) as Movie[];
      
      setMovies(p === 1 ? data : [...movies, ...data]);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(1);
  }, [sortBy, selectedGenre, year, minRating]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const getDynamicTitle = () => {
    const genreName = MOVIE_GENRES.find(g => g.id.toString() === selectedGenre)?.name;
    const prefix = genreName ? `${genreName} ` : '';
    
    if (year !== 'all') {
      return `${prefix}Movies from ${year}`;
    }

    switch (sortBy) {
      case 'primary_release_date.desc': return `Latest ${prefix}Movies`;
      case 'vote_average.desc': return `Top Rated ${prefix}Movies`;
      case 'primary_release_date.asc': return `Classic ${prefix}Movies`;
      default: return `Popular ${prefix}Movies`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{getDynamicTitle()}</h1>
            <p className="text-muted-foreground transition-all duration-300">
              {movies.length} titles available
            </p>
          </div>

          {/* New Filter Bar */}
          <div className="flex flex-wrap items-end gap-6 mb-12 p-6 bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl">
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
                  <SelectItem value="primary_release_date.desc">Newest First</SelectItem>
                  <SelectItem value="primary_release_date.asc">Oldest First</SelectItem>
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
                  {MOVIE_GENRES.map(g => (
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
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <ContentCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>

          {/* Loading / Load More */}
          <div className="flex justify-center mt-16">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Fetching more movies...</p>
              </div>
            ) : movies.length > 0 ? (
              <Button 
                variant="outline" 
                onClick={loadMore} 
                className="rounded-full px-12 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-lg hover:shadow-primary/10"
              >
                Load More Content
              </Button>
            ) : (
              <div className="text-center py-20 opacity-50">
                <p className="text-xl">No movies found matching your filters.</p>
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

export default Movies;
