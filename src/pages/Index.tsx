import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ContentRow } from '@/components/ContentRow';
import { ChannelCard } from '@/components/ChannelCard';
import { liveChannels } from '@/lib/channels';
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTV,
  fetchTopRatedMovies,
  fetchNowPlaying,
  Movie,
  TVShow,
} from '@/lib/tmdb';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<TVShow[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [trendingData, moviesData, tvData, topData, nowData] = await Promise.all([
          fetchTrending('all', 'week'),
          fetchPopularMovies(),
          fetchPopularTV(),
          fetchTopRatedMovies(),
          fetchNowPlaying(),
        ]);
        setTrending(trendingData);
        setPopularMovies(moviesData);
        setPopularTV(tvData);
        setTopRated(topData);
        setNowPlaying(nowData);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <HeroSection items={trending} />

        <div className="relative -mt-20 z-10">
          <ContentRow title="🔥 Trending Now" items={trending} />
          <ContentRow title="🎬 Now Playing" items={nowPlaying} type="movie" />
          <ContentRow title="🎥 Popular Movies" items={popularMovies} type="movie" />
          <ContentRow title="📺 Popular TV Shows" items={popularTV} type="tv" />
          <ContentRow title="⭐ Top Rated" items={topRated} type="movie" />

          {/* Live TV Preview */}
          <section className="py-6">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold">📡 Live TV</h2>
                <Link
                  to="/live-tv"
                  className="text-primary text-sm hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {liveChannels.slice(0, 4).map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 PinoyFlix. All rights reserved.</p>
          <p className="mt-2">Content provided by TMDB. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
