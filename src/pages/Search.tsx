import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { GenreFilter } from '@/components/GenreFilter';
import { discoverContent, searchMulti, MOVIE_GENRES, TV_GENRES, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, SearchX, Filter, X, Search as SearchIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

type ContentType = 'movie' | 'tv';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(!searchQuery);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  // Search mode - when query param exists
  const fetchSearchResults = async (p: number, append = false) => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const data = await searchMulti(searchQuery, p);
      const resultsWithType = (data as Movie[]).map(item => ({
        ...item,
      }));
      setResults(append ? [...results, ...resultsWithType] : resultsWithType);
      setHasMore(data.length >= 20);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Discover mode - when no query param
  const fetchDiscoverResults = async (p: number, append = false) => {
    setIsLoading(true);
    try {
      const data = await discoverContent(contentType, {
        page: p,
        genre: selectedGenre || undefined,
        year: selectedYear ? parseInt(selectedYear) : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
      });
      
      const resultsWithType = (data as Movie[]).map(item => ({
        ...item,
        media_type: contentType,
      }));
      
      setResults(append ? [...results, ...resultsWithType] : resultsWithType);
      setHasMore(data.length >= 20);
    } catch (error) {
      console.error('Discover failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for search mode
  useEffect(() => {
    if (searchQuery) {
      setResults([]);
      setPage(1);
      setHasMore(true);
      fetchSearchResults(1);
    }
  }, [searchQuery]);

  // Effect for discover mode
  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      setPage(1);
      setHasMore(true);
      fetchDiscoverResults(1);
    }
  }, [searchQuery, contentType, selectedGenre, selectedYear, minRating, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    if (searchQuery) {
      fetchSearchResults(nextPage, true);
    } else {
      fetchDiscoverResults(nextPage, true);
    }
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear('');
    setMinRating(0);
    setSortBy('popularity.desc');
  };

  const clearSearch = () => {
    setSearchParams({});
  };

  const genres = contentType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const hasActiveFilters = selectedGenre || selectedYear || minRating > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          {/* Header - different for search vs discover */}
          {searchQuery ? (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <SearchIcon className="w-6 h-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  Search results for "{searchQuery}"
                </h1>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSearch} className="gap-2 text-muted-foreground">
                <X className="w-4 h-4" />
                Clear search
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl md:text-4xl font-bold">Discover</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          )}

          {/* Filters Panel - only for discover mode */}
          {!searchQuery && showFilters && (
            <div className="space-y-4 mb-8 p-4 rounded-xl bg-secondary/50 border border-border">
              {/* Content Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={contentType === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContentType('movie')}
                >
                  Movies
                </Button>
                <Button
                  variant={contentType === 'tv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContentType('tv')}
                >
                  TV Shows
                </Button>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Genre</label>
                <GenreFilter
                  genres={genres}
                  selectedGenre={selectedGenre}
                  onSelectGenre={setSelectedGenre}
                />
              </div>

              {/* Year, Rating, Sort */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Year */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Min Rating: {minRating > 0 ? minRating.toFixed(1) : 'Any'}
                  </label>
                  <Slider
                    value={[minRating]}
                    onValueChange={([value]) => setMinRating(value)}
                    max={9}
                    step={0.5}
                    className="py-2"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity.desc">Most Popular</SelectItem>
                      <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                      <SelectItem value="primary_release_date.desc">Newest</SelectItem>
                      <SelectItem value="primary_release_date.asc">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Results */}
          {isLoading && results.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {contentType === 'movie' ? 'movies' : 'TV shows'}
                  {selectedGenre && ` in ${genres.find(g => g.id === selectedGenre)?.name}`}
                  {selectedYear && ` from ${selectedYear}`}
                  {minRating > 0 && ` rated ${minRating}+`}
                </p>
              )}
              {searchQuery && (
                <p className="text-sm text-muted-foreground mb-4">
                  Found {results.length} results
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((item) => {
                  const type = searchQuery 
                    ? (item.media_type === 'tv' || 'name' in item && !('title' in item) ? 'tv' : 'movie')
                    : contentType;
                  return (
                    <ContentCard
                      key={`${item.id}-${type}`}
                      item={item}
                      type={type}
                    />
                  );
                })}
              </div>
              
              {/* Load More */}
              <div className="flex justify-center mt-8">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <SearchX className="w-16 h-16 mb-4" />
              <p className="text-lg">No results found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
