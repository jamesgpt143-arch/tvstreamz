import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { fetchAnimeTV, fetchAnimeMovies, fetchTopRatedAnime, TVShow, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Category = 'popular_tv' | 'movies' | 'top_rated';

const Anime = () => {
  const [items, setItems] = useState<(TVShow | Movie)[]>([]);
  const [category, setCategory] = useState<Category>('popular_tv');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const categories: { id: Category; label: string }[] = [
    { id: 'popular_tv', label: 'Popular Series' },
    { id: 'movies', label: 'Anime Movies' },
    { id: 'top_rated', label: 'Top Rated' },
  ];

  const fetchAnime = async (cat: Category, p: number) => {
    setIsLoading(true);
    try {
      let data: (TVShow | Movie)[];
      switch (cat) {
        case 'movies':
          data = await fetchAnimeMovies(p);
          break;
        case 'top_rated':
          data = await fetchTopRatedAnime(p);
          break;
        default:
          data = await fetchAnimeTV(p);
      }
      setItems(p === 1 ? data : [...items, ...data]);
    } catch (error) {
      console.error('Failed to fetch anime:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchAnime(category, 1);
  }, [category]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnime(category, nextPage);
  };

  const getType = (item: TVShow | Movie): 'movie' | 'tv' => {
    return 'title' in item ? 'movie' : 'tv';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Anime</h1>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
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

          {/* Anime Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <ContentCard key={item.id} item={item as Movie} type={getType(item)} />
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

export default Anime;
