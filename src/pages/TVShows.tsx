import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { GenreFilter } from '@/components/GenreFilter';
import { fetchPopularTV, fetchTopRatedTV, discoverContent, TVShow, TV_GENRES } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Category = 'popular' | 'top_rated';

const TVShows = () => {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [category, setCategory] = useState<Category>('popular');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const categories: { id: Category; label: string }[] = [
    { id: 'popular', label: 'Popular' },
    { id: 'top_rated', label: 'Top Rated' },
  ];

  const fetchShows = async (cat: Category, p: number, genre: number | null) => {
    setIsLoading(true);
    try {
      let data: TVShow[];
      
      if (genre) {
        data = await discoverContent('tv', {
          page: p,
          genre,
          sortBy: cat === 'top_rated' ? 'vote_average.desc' : 'popularity.desc',
        }) as TVShow[];
      } else {
        data = cat === 'top_rated' ? await fetchTopRatedTV(p) : await fetchPopularTV(p);
      }
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
    fetchShows(category, 1, selectedGenre);
  }, [category, selectedGenre]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchShows(category, nextPage, selectedGenre);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 md:pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">TV Shows</h1>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? 'default' : 'outline'}
                onClick={() => setCategory(cat.id)}
                className="border-border"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Genre Filter */}
          <div className="mb-8">
            <GenreFilter
              genres={TV_GENRES}
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
            />
          </div>

          {/* Shows Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {shows.map((show) => (
              <ContentCard key={show.id} item={show} type="tv" />
            ))}
          </div>

          {/* Loading / Load More */}
          <div className="flex justify-center mt-8">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Button variant="outline" onClick={loadMore} className="border-border">
                Load More
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TVShows;
