import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TrailerModal } from '@/components/TrailerModal';
import { ContentRow } from '@/components/ContentRow';
import { EpisodePicker } from '@/components/EpisodePicker';
import {
  fetchMovieDetails,
  fetchTVDetails,
  fetchTrending,
  fetchVideos,
  getTrailerUrl,
  getStreamingUrls,
  getImageUrl,
  MovieDetails,
  Movie,
} from '@/lib/tmdb';
import { addToWatchHistory } from '@/lib/watchHistory';
import { addToMyList, removeFromMyList, isInMyList } from '@/lib/myList';
import { updateWatchProgress } from '@/lib/continueWatching';
import { ChevronLeft, Star, Calendar, Clock, Loader2, Play, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // For TV shows
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  // My List state
  const [inMyList, setInMyList] = useState(false);
  
  useEffect(() => {
    if (id && type) {
      setInMyList(isInMyList(Number(id), type));
    }
  }, [id, type]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id || !type) return;
      setIsLoading(true);
      setShowTrailer(false);
      setTrailerUrl(null);
      
      try {
        const data = type === 'movie' 
          ? await fetchMovieDetails(Number(id))
          : await fetchTVDetails(Number(id));
        setDetails(data);
        
        // Fetch trailer
        const videos = await fetchVideos(Number(id), type);
        const trailer = getTrailerUrl(videos);
        setTrailerUrl(trailer);
        
        // Track watch history
        addToWatchHistory({
          id: data.id,
          type: type as 'movie' | 'tv',
          title: data.title || data.name || '',
          poster_path: data.poster_path,
          genre_ids: data.genres?.map(g => g.id) || [],
        });

        // Track continue watching (estimate progress since we use external embeds)
        const runtime = data.runtime || (data.episode_run_time?.[0] ?? 90);
        updateWatchProgress({
          id: data.id,
          type: type as 'movie' | 'tv',
          title: data.title || data.name || '',
          poster_path: data.poster_path,
          progress: 5, // Start at 5% when they open
          currentTime: 0,
          duration: runtime * 60,
          season: type === 'tv' ? 1 : undefined,
          episode: type === 'tv' ? 1 : undefined,
        });
        
        // Reset to season 1, episode 1 when loading new show
        if (type === 'tv') {
          setSelectedSeason(1);
          setSelectedEpisode(1);
        }

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

  const handleEpisodeSelect = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    
    // Update continue watching for new episode
    if (details) {
      const runtime = details.episode_run_time?.[0] ?? 45;
      updateWatchProgress({
        id: details.id,
        type: 'tv',
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        progress: 5,
        currentTime: 0,
        duration: runtime * 60,
        season,
        episode,
      });
    }
  };

  const handleToggleMyList = () => {
    if (!details || !type) return;
    
    if (inMyList) {
      removeFromMyList(details.id, type);
      setInMyList(false);
      toast.success('Removed from My List');
    } else {
      const added = addToMyList({
        id: details.id,
        type: type,
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        vote_average: details.vote_average,
        release_date: details.release_date || details.first_air_date,
      });
      if (added) {
        setInMyList(true);
        toast.success('Added to My List');
      }
    }
  };

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
  const servers = type === 'movie'
    ? getStreamingUrls(details.id, 'movie')
    : getStreamingUrls(details.id, 'tv', selectedSeason, selectedEpisode);
  const isTV = type === 'tv';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <TrailerModal
          trailerUrl={trailerUrl}
          title={title}
          onClose={() => setShowTrailer(false)}
          onSkip={() => setShowTrailer(false)}
        />
      )}

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
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/20 text-yellow-400 font-bold">
                  <Star className="w-4 h-4" fill="currentColor" />
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
                {isTV && (
                  <span className="text-muted-foreground">
                    S{selectedSeason} E{selectedEpisode}
                  </span>
                )}
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  variant={inMyList ? "secondary" : "outline"}
                  onClick={handleToggleMyList}
                  className="gap-2"
                >
                  {inMyList ? (
                    <>
                      <Check className="w-4 h-4" />
                      In My List
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to My List
                    </>
                  )}
                </Button>
                {trailerUrl && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTrailer(true)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Watch Trailer
                  </Button>
                )}
              </div>

              {/* Video Player */}
              <VideoPlayer servers={servers} title={title} />

              {/* Episode Picker for TV Shows */}
              {isTV && details.seasons && details.seasons.length > 0 && (
                <div className="mt-6">
                  <EpisodePicker
                    tvId={details.id}
                    seasons={details.seasons}
                    onSelect={handleEpisodeSelect}
                    currentSeason={selectedSeason}
                    currentEpisode={selectedEpisode}
                  />
                </div>
              )}
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
