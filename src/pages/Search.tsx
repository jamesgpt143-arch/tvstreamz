import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { GenreFilter } from '@/components/GenreFilter';
import { discoverContent, MOVIE_GENRES, TV_GENRES, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, SearchX, Filter, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

type ContentType = 'movie' | 'tv';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  
  // Filters
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const fetchResults = async (p: number, append = false) => {
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
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setResults([]);
    setPage(1);
    fetchResults(1);
  }, [contentType, selectedGenre, selectedYear, minRating, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(nextPage, true);
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear('');
    setMinRating(0);
    setSortBy('popularity.desc');
  };

  const genres = contentType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const hasActiveFilters = selectedGenre || selectedYear || minRating > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
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

          {/* Filters Panel */}
          {showFilters && (
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
              <p className="text-sm text-muted-foreground mb-4">
                Showing {contentType === 'movie' ? 'movies' : 'TV shows'}
                {selectedGenre && ` in ${genres.find(g => g.id === selectedGenre)?.name}`}
                {selectedYear && ` from ${selectedYear}`}
                {minRating > 0 && ` rated ${minRating}+`}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    type={contentType}
                  />
                ))}
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
