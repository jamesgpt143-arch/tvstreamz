import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ContentCard } from '@/components/ContentCard';
import { searchMulti, Movie } from '@/lib/tmdb';
import { Loader2, SearchX } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await searchMulti(query);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground mb-8">
            {query ? `Showing results for "${query}"` : 'Enter a search term'}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  type={item.media_type as 'movie' | 'tv'}
                />
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <SearchX className="w-16 h-16 mb-4" />
              <p className="text-lg">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Search;
