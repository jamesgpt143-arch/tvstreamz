import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ContentRow } from '@/components/ContentRow';
import {
  fetchMovieDetails,
  fetchTVDetails,
  fetchTrending,
  getStreamingUrls,
  getImageUrl,
  MovieDetails,
  Movie,
} from '@/lib/tmdb';
import { ChevronLeft, Star, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id || !type) return;
      setIsLoading(true);
      try {
        const data = type === 'movie' 
          ? await fetchMovieDetails(Number(id))
          : await fetchTVDetails(Number(id));
        setDetails(data);

        const trending = await fetchTrending(type, 'week');
        setSimilar(trending.filter((item) => item.id !== Number(id)));
      } catch (error) {
        console.error('Failed to load details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id, type]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Content not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const title = details.title || details.name || '';
  const date = details.release_date || details.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const runtime = details.runtime || (details.episode_run_time?.[0] ?? 0);
  const servers = getStreamingUrls(details.id, type as 'movie' | 'tv');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop */}
      <div
        className="absolute top-0 left-0 right-0 h-[50vh] bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${getImageUrl(details.backdrop_path, 'original')})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
      </div>

      <main className="relative pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-4 gap-2">
            <Link to={type === 'movie' ? '/movies' : '/tv-shows'}>
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>

          <div className="grid lg:grid-cols-[300px_1fr] gap-8 mb-8">
            {/* Poster */}
            <div className="hidden lg:block">
              <img
                src={getImageUrl(details.poster_path, 'w500')}
                alt={title}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            {/* Content */}
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{title}</h1>
              
              {details.tagline && (
                <p className="text-muted-foreground italic mb-4">{details.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  {details.vote_average.toFixed(1)}
                </span>
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {year}
                  </span>
                )}
                {runtime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {runtime} min
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs uppercase font-medium">
                  {type === 'movie' ? 'Movie' : 'TV Series'}
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-4">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-full bg-secondary text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <p className="text-muted-foreground mb-6 max-w-3xl">{details.overview}</p>

              {/* Video Player */}
              <VideoPlayer servers={servers} title={title} />
            </div>
          </div>

          {/* Similar Content */}
          {similar.length > 0 && (
            <ContentRow
              title={type === 'movie' ? 'Similar Movies' : 'Similar Shows'}
              items={similar}
              type={type as 'movie' | 'tv'}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Watch;
