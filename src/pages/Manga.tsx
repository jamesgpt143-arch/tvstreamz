import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MangaCard } from '@/components/MangaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  fetchPopularManga,
  fetchLatestManga,
  searchManga,
  fetchMangaByTag,
  MANGA_GENRES,
  type Manga,
} from '@/lib/mangadex';
import { Loader2, Search, X, BookOpen } from 'lucide-react';

const categories = [
  { id: 'popular', label: '🔥 Popular' },
  { id: 'latest', label: '📖 Latest' },
];

const Manga = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [category, setCategory] = useState('popular');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const fetchManga = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    const offset = currentPage * LIMIT;

    try {
      let data: Manga[] = [];

      if (searchQuery.trim()) {
        data = await searchManga(searchQuery, LIMIT, offset);
      } else if (selectedGenre) {
        data = await fetchMangaByTag(selectedGenre, LIMIT, offset);
      } else if (category === 'popular') {
        data = await fetchPopularManga(LIMIT, offset);
      } else {
        data = await fetchLatestManga(LIMIT, offset);
      }

      setHasMore(data.length === LIMIT);

      if (reset) {
        setMangaList(data);
        setPage(1);
      } else {
        setMangaList((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to fetch manga:', error);
    }
  };

  // Initial load and category/genre change
  useEffect(() => {
    setIsLoading(true);
    setMangaList([]);
    setPage(0);
    fetchManga(true).finally(() => setIsLoading(false));
  }, [category, selectedGenre]);

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setIsLoading(true);
    setMangaList([]);
    setPage(0);
    setSelectedGenre(null);
    await fetchManga(true);
    setIsLoading(false);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsLoading(true);
    setMangaList([]);
    setPage(0);
    fetchManga(true).finally(() => setIsLoading(false));
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    await fetchManga(false);
    setIsLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Manga</h1>
            <p className="text-muted-foreground text-sm">
              Browse at basahin ang manga • Powered by MangaDex
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search manga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id && !selectedGenre && !searchQuery ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCategory(cat.id);
                setSelectedGenre(null);
                setSearchQuery('');
              }}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MANGA_GENRES.map((genre) => (
            <Button
              key={genre.id}
              variant={selectedGenre === genre.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => {
                setSelectedGenre(selectedGenre === genre.id ? null : genre.id);
                setSearchQuery('');
              }}
            >
              {genre.name}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : mangaList.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Walang nakitang manga</p>
          </div>
        ) : (
          <>
            {/* Manga Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mangaList.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Manga;
