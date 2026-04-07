import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { updateWatchProgress, getWatchProgress } from '@/lib/continueWatching';
import { trackPageView, trackContentView } from '@/lib/analytics';
import { ChevronLeft, Star, Calendar, Clock, Loader2, Play, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Watch = () => {
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // For TV shows
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  // For persistence and timer
  const [currentServer, setCurrentServer] = useState<string | undefined>(undefined);
  
  // My List state
  const [inMyList, setInMyList] = useState(false);
  
  useEffect(() => {
    if (id && type) {
      setInMyList(isInMyList(Number(id), type));
      
      // Load existing progress to restore season/episode/server
      const progress = getWatchProgress(Number(id), type);
      if (progress) {
        if (type === 'tv') {
          setSelectedSeason(progress.season || 1);
          setSelectedEpisode(progress.episode || 1);
        }
        setCurrentServer(progress.lastServer);
      }
    }
  }, [id, type]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id || !type) return;
      setIsLoading(true);
      setShowTrailer(false);
      setTrailerUrl(null);
      
      // Track page view
      trackPageView(`/watch/${type}/${id}`);
      
      try {
        const data = type === 'movie' 
          ? await fetchMovieDetails(Number(id))
          : await fetchTVDetails(Number(id));
        setDetails(data);
        
        // Track content view for analytics
        trackContentView(id, type, data.title || data.name || '');
        
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

        // Initialize progress only if it doesn't exist
        const existingProgress = getWatchProgress(data.id, type as 'movie' | 'tv');
        if (!existingProgress) {
          const runtime = data.runtime || (data.episode_run_time?.[0] ?? 90);
          updateWatchProgress({
            id: data.id,
            type: type as 'movie' | 'tv',
            title: data.title || data.name || '',
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            progress: 5,
            currentTime: 0,
            duration: runtime * 60,
            season: type === 'tv' ? 1 : undefined,
            episode: type === 'tv' ? 1 : undefined,
          });
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

  // Background Progress Timer
  useEffect(() => {
    if (!details || isLoading || !type) return;

    const interval = setInterval(() => {
      const progress = getWatchProgress(details.id, type as 'movie' | 'tv');
      const runtime = details.runtime || (details.episode_run_time?.[0] ?? 90);
      const totalDuration = runtime * 60;
      
      // Every tick adds 30 seconds of watch time
      let newTime = (progress?.currentTime || 0) + 30;
      if (newTime > totalDuration) newTime = totalDuration;
      
      const newProgress = Math.min(95, (newTime / totalDuration) * 100);

      updateWatchProgress({
        id: details.id,
        type: type as 'movie' | 'tv',
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        progress: newProgress,
        currentTime: newTime,
        duration: totalDuration,
        season: type === 'tv' ? selectedSeason : undefined,
        episode: type === 'tv' ? selectedEpisode : undefined,
        lastServer: currentServer,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [details, isLoading, type, selectedSeason, selectedEpisode, currentServer]);

  const handleEpisodeSelect = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    
    // Check for existing progress for this specific episode isn't easy since we store by ID.
    // In our system, TV shows share one progress entry. We should reset progress if it's a new episode
    // or just leave it. Usually, users want specific episode tracking.
    // For now, we'll reset to 5% for the new episode specifically.
    if (details) {
      const runtime = details.episode_run_time?.[0] ?? 45;
      updateWatchProgress({
        id: details.id,
        type: 'tv',
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        progress: 5,
        currentTime: 0,
        duration: runtime * 60,
        season,
        episode,
        lastServer: currentServer,
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
    <div className="min-h-screen bg-background text-foreground">
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

      {/* Hero Section (A bit shorter, backdrop only) */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] w-full">
        {/* Backdrop Background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 overflow-hidden"
          style={{
            backgroundImage: `url(${getImageUrl(details.backdrop_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pt-32 pb-12 md:pb-16 max-w-7xl animate-slide-up">
          <div className="max-w-4xl space-y-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors gap-2 rounded-full"
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  const isAnime = details?.genres?.some(g => g.id === 16);
                  navigate(type === 'movie' ? '/movies' : (isAnime ? '/anime' : '/tv-shows'));
                }
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white drop-shadow-2xl leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
                <Star className="w-4 h-4 fill-current" />
                {(details.vote_average || 0).toFixed(1)}
              </span>
              {year && <span className="text-zinc-300 drop-shadow-md">{year}</span>}
              {runtime > 0 && <span className="text-zinc-300 drop-shadow-md">{runtime} min</span>}
              <span className="px-3 py-1 rounded bg-primary/20 text-primary text-[10px] uppercase font-black tracking-widest border border-primary/20">
                {type === 'movie' ? 'Movie' : 'TV Series'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {details.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-2 py-0.5 rounded bg-zinc-800/40 border border-zinc-700/50 text-[11px] text-zinc-300 backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-zinc-300 leading-relaxed text-sm md:text-base max-w-4xl drop-shadow-lg">
              {details.overview}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant={inMyList ? "secondary" : "outline"}
                onClick={handleToggleMyList}
                className="rounded-full px-6 bg-zinc-800/20 border-zinc-700/50 backdrop-blur-md hover:bg-zinc-800/40"
              >
                {inMyList ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {inMyList ? "In My List" : "Add to List"}
              </Button>
              {trailerUrl && (
                <Button
                  variant="default"
                  onClick={() => setShowTrailer(true)}
                  className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Watch Trailer
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Player Section (Centered) */}
      <section className="relative z-20 -mt-8 md:-mt-12 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
              {/* Video Player Container */}
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 bg-black ring-1 ring-white/10">
                <VideoPlayer 
                  servers={servers} 
                  title={details.title || details.name || ''} 
                  initialServer={currentServer}
                  onServerChange={setCurrentServer}
                />
              </div>

          {/* Episode Picker for TV Shows */}
          {isTV && details.seasons && (
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full" />
                Select Episode
              </h2>
              <EpisodePicker
                tvId={details.id}
                seasons={details.seasons}
                onSelect={handleEpisodeSelect}
                currentSeason={selectedSeason}
                currentEpisode={selectedEpisode}
              />
            </div>
          )}

          {/* Similar Content Section */}
          {similar.length > 0 && (
            <div className="mt-20 pt-10 border-t border-white/5">
              <ContentRow
                title={type === 'movie' ? 'More Like This' : 'You Might Also Like'}
                items={similar}
                type={type as 'movie' | 'tv'}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Watch;
