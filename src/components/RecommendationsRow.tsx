import { useEffect, useState } from 'react';
import { ContentCard } from './ContentCard';
import { getLastWatched, WatchedItem } from '@/lib/watchHistory';
import { Movie } from '@/lib/tmdb';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2283c405a7e1d26a6b72a786916aad85';

interface RecommendationsRowProps {
  className?: string;
}

export const RecommendationsRow = ({ className }: RecommendationsRowProps) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [lastWatched, setLastWatched] = useState<WatchedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      const watched = getLastWatched();
      setLastWatched(watched);
      
      if (!watched) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${watched.type}/${watched.id}/recommendations?api_key=${API_KEY}`
        );
        const data = await response.json();
        setRecommendations(data.results?.slice(0, 10) || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  if (isLoading || !lastWatched || recommendations.length === 0) {
    return null;
  }

  return (
    <section className={`py-6 ${className || ''}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          🎯 Because you watched "{lastWatched.title}"
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {recommendations.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-36 sm:w-44">
              <ContentCard
                item={item}
                type={lastWatched.type}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
