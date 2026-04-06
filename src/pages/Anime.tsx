import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { 
  fetchAnimeTV, 
  fetchAnimeMovies, 
  fetchTopRatedAnime, 
  fetchAiringAnime,
  fetchNewAnimeEpisodes,
  discoverContent,
  searchMulti,
  TVShow, 
  Movie,
  Genre
} from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2, Search, TrendingUp, Star, Tv, Film, XCircle, ChevronLeft } from 'lucide-react';
import { usePagePopup } from '@/hooks/usePagePopup';
import { AnimeHero } from '@/components/anime/AnimeHero';
import { GenreFilter } from '@/components/anime/GenreFilter';
import { Input } from '@/components/ui/input';

type ViewMode = 'browse' | 'search' | 'category';
type AnimeCategory = 'new_releases' | 'airing_now' | 'movies' | 'top_rated';

const Anime = () => {
  usePagePopup('anime');
  
  const [trending, setTrending] = useState<(TVShow | Movie)[]>([]);
  const [airing, setAiring] = useState<TVShow[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<TVShow[]>([]);
  const [browseItems, setBrowseItems] = useState<(TVShow | Movie)[]>([]);
  
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [searchResults, setSearchResults] = useState<(TVShow | Movie)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AnimeCategory | null>(null);
  const [categoryItems, setCategoryItems] = useState<(TVShow | Movie)[]>([]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [trendingData, airingData, moviesData, newData] = await Promise.all([
        fetchAnimeTV(1),
        fetchAiringAnime(1),
        fetchAnimeMovies(1),
        fetchNewAnimeEpisodes(1)
      ]);
      setTrending(trendingData);
      setAiring(airingData);
      setMovies(moviesData);
      setNewReleases(newData);
      setBrowseItems(trendingData);
    } catch (error) {
      console.error('Failed to fetch initial anime data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrowseData = async (genreId: number | null, p: number) => {
    setIsLoading(true);
    try {
      // Must include genre 16 (Animation)
      const data = await discoverContent('tv', {
        page: p,
        genre: genreId || 16, 
        sortBy: 'popularity.desc'
      });
      setBrowseItems(p === 1 ? data : [...browseItems, ...data]);
    } catch (error) {
      console.error('Failed to fetch browse data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryData = async (cat: AnimeCategory, p: number) => {
    setIsLoading(true);
    try {
      let data: (TVShow | Movie)[] = [];
      switch (cat) {
        case 'new_releases': data = await fetchNewAnimeEpisodes(p); break;
        case 'airing_now': data = await fetchAiringAnime(p); break;
        case 'movies': data = await fetchAnimeMovies(p); break;
        case 'top_rated': data = await fetchTopRatedAnime(p); break;
      }
      setCategoryItems(p === 1 ? data : [...categoryItems, ...data]);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSearchData = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const results = await searchMulti(query, 1);
      // Filter for Animation genre (16)
      const animated = results.filter(item => item.genre_ids?.includes(16));
      setSearchResults(animated);
      setViewMode('search');
    } catch (error) {
      console.error('Failed to search anime:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchSearchData(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (!searchQuery.trim() && viewMode === 'search') {
      setViewMode('browse');
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedGenre !== null) {
      setPage(1);
      fetchBrowseData(selectedGenre, 1);
    }
  }, [selectedGenre]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    if (viewMode === 'category' && selectedCategory) {
      fetchCategoryData(selectedCategory, nextPage);
    } else {
      fetchBrowseData(selectedGenre, nextPage);
    }
  };

  const openCategory = (cat: AnimeCategory) => {
    setSelectedCategory(cat);
    setViewMode('category');
    setPage(1);
    fetchCategoryData(cat, 1);
  };

  const closeCategory = () => {
    setViewMode('browse');
    setSelectedCategory(null);
    setCategoryItems([]);
  };

  const getCategoryTitle = (cat: AnimeCategory | null) => {
    switch (cat) {
      case 'new_releases': return 'Recently Released';
      case 'airing_now': return 'Airing This Season';
      case 'movies': return 'Anime Movies';
      case 'top_rated': return 'Highest Rated';
      default: return 'Animation';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchData(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-20 pb-20">
        {/* Featured Hero */}
        {viewMode === 'browse' && !searchQuery && !selectedGenre && trending.length > 0 && (
          <AnimeHero items={trending} />
        )}

        <div className="container mx-auto px-4 md:px-6">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 mt-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Anime Center</h1>
              <p className="text-muted-foreground">Discover the best of animation.</p>
            </div>
            <form onSubmit={handleSearch} className="relative w-full max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search series, movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-muted/40 border-border/50 rounded-full focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </form>
          </div>

          {/* MAIN CONTENT AREA */}
          {viewMode === 'browse' ? (
            <div className="space-y-16">
              <GenreFilter 
                selectedGenre={selectedGenre} 
                onGenreSelect={setSelectedGenre} 
              />

              {selectedGenre === null ? (
                <>
                  {/* Recently Released */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Recently Released
                      </h2>
                      <Button variant="link" onClick={() => openCategory('new_releases')} className="text-primary hover:underline">
                        See All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {newReleases.slice(0, 6).map((item) => (
                        <div key={item.id} className="relative group">
                          <ContentCard item={item} type="tv" />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold uppercase tracking-tighter shadow-lg">
                            New Episode
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Airing Now */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Tv className="w-6 h-6 text-primary" />
                        Airing This Season
                      </h2>
                      <Button variant="link" onClick={() => openCategory('airing_now')} className="text-primary hover:underline">
                        See All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {airing.slice(0, 12).map((item) => (
                        <ContentCard key={item.id} item={item} type="tv" />
                      ))}
                    </div>
                  </section>

                  {/* Movies */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Film className="w-6 h-6 text-primary" />
                        Animation Movies
                      </h2>
                      <Button variant="link" onClick={() => openCategory('movies')} className="text-primary hover:underline">
                        See All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {movies.slice(0, 12).map((item) => (
                        <ContentCard key={item.id} item={item} type="movie" />
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                /* Genre Results */
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="sm" onClick={() => setSelectedGenre(null)} className="rounded-full">
                      Back to All
                    </Button>
                    <h2 className="text-2xl font-bold">Results</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {browseItems.map((item) => (
                      <ContentCard key={item.id} item={item as Movie} type={'title' in item ? 'movie' : 'tv'} />
                    ))}
                  </div>
                  <div className="flex justify-center mt-12">
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <Button variant="outline" onClick={loadMore} className="rounded-full px-10 border-border/50">
                        Load More
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : viewMode === 'category' ? (
            /* Category All View */
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-10">
                <Button variant="outline" size="icon" onClick={closeCategory} className="rounded-full h-10 w-10">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-3xl font-bold">{getCategoryTitle(selectedCategory)}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {categoryItems.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={item as Movie} 
                    type={selectedCategory === 'movies' ? 'movie' : 'tv'} 
                  />
                ))}
              </div>
              <div className="flex justify-center mt-12">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Button variant="outline" onClick={loadMore} className="rounded-full px-10 border-border/50">
                    Load More {getCategoryTitle(selectedCategory)}
                  </Button>
                )}
              </div>
            </section>
          ) : (
            /* Search Results */
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Search className="w-6 h-6 text-primary" />
                  Search Results for "{searchQuery}"
                </h2>
                <Button variant="ghost" onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-primary">
                  Clear Search
                </Button>
              </div>
              {isLoading ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {searchResults.map((item) => (
                    <ContentCard 
                      key={item.id} 
                      item={item as Movie} 
                      type={'title' in item ? 'movie' : 'tv'} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border/50 rounded-3xl">
                  <XCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl font-medium text-muted-foreground">No animated series found matching your search.</p>
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    Show popular instead
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Anime;
