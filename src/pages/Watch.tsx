import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TrailerModal } from '@/components/TrailerModal';
import { ContentRow } from '@/components/ContentRow';
import { EpisodePicker } from '@/components/EpisodePicker';
import { CastSection } from '@/components/CastSection';

import { fetchMovieDetails,
  fetchTVDetails,
  fetchTrending,
  fetchVideos,
  getTrailerUrl,
  getStreamingUrls,
  getImageUrl,
  MovieDetails,
  Movie,
  findTMDBIdByTitle,
  fetchRecommendations,
  fetchSimilar
} from '@/lib/tmdb';
import { getAnimeById, fetchAnimeList, getAnilistIdFromMalId, getMalIdFromTitle, getAnimeAiredEpisodes, fetchAnimeRecommendations } from '@/lib/anime-db';
import { addToWatchHistory } from '@/lib/watchHistory';
import { updateWatchProgress, getWatchProgress } from '@/lib/continueWatching';
import { trackPageView, trackContentView } from '@/lib/analytics';
import { ChevronLeft, Star, Calendar, Clock, Loader2, Play, Plus, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// BAGO: Import para sa ating custom hook!
import { useUserPreferences } from '@/hooks/useUserPreferences';

const Watch = () => {
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>();
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
  
  // For Anime SUB/DUB toggle
  const [isDub, setIsDub] = useState(false);
  
  // For resolving Anime servers when navigating from Search
  const [resolvedMalId, setResolvedMalId] = useState<string | undefined>(undefined);
  const [animeEpisodesCount, setAnimeEpisodesCount] = useState<number | null>(null);

  // BAGO: Gamitin natin ang Hook para sa pag-manage ng My List!
  const { isInMyList, addToMyList, removeFromMyList } = useUserPreferences();
  
  // BAGO: Awtomatiko itong mag-a-update at hindi na kailangan ng `useState` at `useEffect`
  const inMyList = details ? isInMyList(Number(details.id), (type === 'anime' ? 'tv' : type) as 'movie' | 'tv') : false;
  
  useEffect(() => {
    if (id && type) {
      // Load existing progress to restore season/episode/server
      const progress = getWatchProgress(Number(id), type as 'movie' | 'tv');
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
        let contentData: MovieDetails | null = null;
        let effectiveType = type;
        let effectiveId = id;
        let finalMalId = type === 'anime' ? id : undefined;

        if (type === 'anime') {
          console.log(`[Watch] Resolving anime ID: ${id}`);
          // Resolve Anime from Jikan
          const animeData = await getAnimeById(id!);
          console.log(`[Watch] Anime title from Jikan: ${animeData.title}`);
          
          let airedEpisodes = animeData.episodes;
          if (animeData.status === 'Currently Airing' || !airedEpisodes) {
            const anilistAired = await getAnimeAiredEpisodes(id!);
            if (anilistAired) airedEpisodes = anilistAired;
          }
          setAnimeEpisodesCount(airedEpisodes || 12); // default to 12 if unknown

          
          // Search TMDB to get the ID for streaming
          let tmdbMatch = await findTMDBIdByTitle(animeData.title);
          
          // Try alternative titles if first search fails
          if (!tmdbMatch && animeData.alternativeTitles?.length > 0) {
            console.log(`[Watch] Primary title search failed, trying alternatives...`);
            for (const altTitle of animeData.alternativeTitles) {
              if (!altTitle) continue;
              tmdbMatch = await findTMDBIdByTitle(altTitle);
              if (tmdbMatch) {
                console.log(`[Watch] Found match using alternative title: ${altTitle}`);
                break;
              }
            }
          }
          
          if (tmdbMatch) {
            console.log(`[Watch] Found TMDB match: ${tmdbMatch.id} (${tmdbMatch.type})`);
            effectiveType = tmdbMatch.type;
            effectiveId = tmdbMatch.id.toString();
            contentData = effectiveType === 'movie' 
              ? await fetchMovieDetails(tmdbMatch.id)
              : await fetchTVDetails(tmdbMatch.id);
            
            // Overwrite with anime-specific metadata if needed
            contentData.title = animeData.title;
            contentData.overview = animeData.synopsis || contentData.overview;
          } else {
            console.warn(`[Watch] Could not find TMDB match for: ${animeData.title}`);
            toast.error("Could not find streaming sources for this anime.");
          }
        } else {
          contentData = type === 'movie' 
            ? await fetchMovieDetails(Number(id))
            : await fetchTVDetails(Number(id));
            
          // If navigating from Search to a TV/Movie that is actually an anime, get its MAL ID
          const isJapaneseAnimation = (contentData as any).original_language === 'ja' && contentData.genres?.some((g: any) => g.id === 16);
          if (isJapaneseAnimation) {
            try {
              const animeTitle = contentData.name || contentData.title || '';
              // Try AniList first (fast, reliable, high rate limit)
              finalMalId = await getMalIdFromTitle(animeTitle) || undefined;
              
              if (!finalMalId) {
                // Fallback to Jikan if AniList fails
                const jikanResult = await fetchAnimeList(1, 3, animeTitle);
                if (jikanResult.data && jikanResult.data.length > 0) {
                  finalMalId = jikanResult.data[0].mal_id.toString();
                }
              }
              console.log(`[Watch] Resolved MAL ID for TMDB content: ${finalMalId}`);
            } catch (e) {
              console.error('Failed to resolve MAL ID for Search result:', e);
            }
          }
        }

        if (!contentData) throw new Error("Content not found");
        
        // MegaPlay supports MAL ID natively
        setResolvedMalId(finalMalId || undefined);
        setDetails(contentData);
        
        // Track content view for analytics
        trackContentView(effectiveId!, effectiveType!, contentData.title || contentData.name || '');
        
        // Fetch trailer
        const videos = await fetchVideos(contentData.id, effectiveType as 'movie' | 'tv');
        const trailer = getTrailerUrl(videos);
        setTrailerUrl(trailer);
        
        // Track watch history
        addToWatchHistory({
          id: contentData.id,
          type: effectiveType as 'movie' | 'tv',
          title: contentData.title || contentData.name || '',
          poster_path: contentData.poster_path,
          genre_ids: contentData.genres?.map(g => g.id) || [],
        });

        // Initialize progress only if it doesn't exist
        const existingProgress = getWatchProgress(contentData.id, effectiveType as 'movie' | 'tv');
        if (!existingProgress) {
          const runtime = contentData.runtime || (contentData.episode_run_time?.[0] ?? 90);
          updateWatchProgress({
            id: contentData.id,
            type: effectiveType as 'movie' | 'tv',
            title: contentData.title || contentData.name || '',
            poster_path: contentData.poster_path,
            backdrop_path: contentData.backdrop_path,
            progress: 5,
            currentTime: 0,
            duration: runtime * 60,
            season: effectiveType === 'tv' ? 1 : undefined,
            episode: effectiveType === 'tv' ? 1 : undefined,
          });
        }

        let trending;
        if (type === 'anime') {
          trending = await fetchAnimeRecommendations(id!);
          if (!trending || trending.length === 0) {
            const fallbackData = await fetchAnimeList(1, 15, '', '', 'popularity', 'desc');
            trending = fallbackData.data;
          }
        } else {
          trending = await fetchRecommendations(Number(effectiveId), effectiveType as 'movie' | 'tv');
          if (!trending || trending.length === 0) {
            trending = await fetchSimilar(Number(effectiveId), effectiveType as 'movie' | 'tv');
          }
          if (!trending || trending.length === 0) {
            trending = await fetchTrending(effectiveType as 'movie' | 'tv', 'week');
          }
        }
        setSimilar(trending.filter((item: any) => item.id !== Number(id) && item.mal_id !== Number(id)));
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
    
    // Auto-play when selecting an episode
    navigate(`/play/${type}/${id}/${season}/${episode}`);
  };

  // BAGO: Mas malinis na Toggle Function
  const handleToggleMyList = () => {
    if (!details || !type) return;
    
    if (inMyList) {
      removeFromMyList(details.id, type as 'movie' | 'tv');
      toast.success('Removed from My List');
    } else {
      const added = addToMyList({
        id: details.id,
        type: type as 'movie' | 'tv',
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        vote_average: details.vote_average,
      });
      if (added) {
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
  const isTV = type === 'tv' || (type === 'anime' && details?.seasons && details.seasons.length > 0);
  const servers = (type === 'movie' || (type === 'anime' && !isTV))
    ? getStreamingUrls(details.id, 'movie', undefined, undefined, resolvedMalId, isDub)
    : getStreamingUrls(details.id, 'tv', selectedSeason, selectedEpisode, resolvedMalId, isDub);

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

      {/* Hero Section */}
      <section className="relative pt-64 md:pt-24 pb-8 md:pb-12 w-full min-h-[85vh] md:min-h-[70vh] flex flex-col justify-end md:justify-center">
        {/* Background - Mobile uses Poster, Desktop uses Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-top md:bg-center transition-all duration-1000 opacity-100 md:opacity-30 md:hidden"
          style={{
            backgroundImage: `url(${getImageUrl(details.poster_path || details.backdrop_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        </div>

        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-30 hidden md:block"
          style={{
            backgroundImage: `url(${getImageUrl(details.backdrop_path || details.poster_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 max-w-6xl animate-slide-up mt-0 md:mt-8">
          
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute -top-48 md:top-0 left-4 md:static md:mb-4 md:-ml-2 w-12 h-12 md:w-auto md:h-auto md:px-4 bg-background/20 backdrop-blur-xl border border-border text-foreground hover:bg-foreground/10 transition-all rounded-full z-50 flex items-center justify-center shadow-lg"
            onClick={() => navigate(type === 'anime' ? '/anime' : (type === 'movie' ? '/movies' : '/tv-shows'))}
          >
            <ChevronLeft className="w-6 h-6 md:w-4 md:h-4" />
            <span className="hidden md:inline ml-2 font-bold">Back</span>
          </Button>

          <div className="bg-transparent md:bg-card/80 md:backdrop-blur-xl md:border md:border-border rounded-3xl pt-16 md:pt-8 p-0 md:p-8 lg:p-10 flex flex-col md:flex-row gap-6 lg:gap-12 items-center md:items-start text-center md:text-left">
            
            {/* Poster - Hidden on mobile, visible on desktop */}
            <div className="hidden md:block w-[180px] sm:w-[220px] md:w-[240px] lg:w-[280px] shrink-0 mx-auto md:mx-0">
              <img 
                src={getImageUrl(details.poster_path, 'w500')} 
                alt={title} 
                className="w-full rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 object-cover aspect-[2/3]"
              />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-5 md:space-y-6 w-full flex flex-col items-center md:items-start">
              <div>
                <h1 className="text-4xl md:text-4xl lg:text-5xl font-black text-foreground drop-shadow-2xl leading-tight mb-2">
                  {title}
                </h1>
                {details.original_title && details.original_title !== title && (
                  <p className="text-lg text-muted-foreground font-medium">
                    {details.original_title}
                  </p>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {(details.vote_average || 0).toFixed(1)}/10
                </span>
                {year && <span>{year}</span>}
                <span className="text-muted-foreground/50">•</span>
                <span className="px-3 py-1 bg-foreground/5 backdrop-blur-md rounded-full border border-border text-xs text-foreground">
                  {details.status || (isTV ? 'Airing' : 'Released')}
                </span>
              </div>

              {/* Genres - Glass Pill Style */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-5 py-2 rounded-full bg-foreground/5 backdrop-blur-xl border border-border text-xs sm:text-sm font-bold text-foreground shadow-lg cursor-default"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row flex-nowrap w-full md:w-auto gap-3 pt-4">
                {/* Watch Now - Prominent button */}
                <Button
                  onClick={() => navigate(type === 'movie' ? `/play/movie/${id}` : `/play/${type}/${id}/1/1`)}
                  className="rounded-full px-8 bg-primary/90 hover:bg-primary backdrop-blur-lg text-white font-black shadow-[0_0_30px_rgba(168,85,247,0.5)] h-14 flex-1 md:flex-none text-sm md:text-base border border-primary/50 transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Watch Now
                </Button>

                {/* Secondary buttons - Hidden on mobile, shown on PC as glass buttons */}
                {trailerUrl && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTrailer(true)}
                    className="rounded-full px-6 h-14 bg-foreground/5 backdrop-blur-xl border-border text-foreground hover:bg-foreground/10 hover:text-foreground flex-1 md:flex-none text-sm font-bold hidden md:flex transition-all hover:scale-105"
                  >
                    Trailer
                  </Button>
                )}

                <Button
                  variant={inMyList ? "secondary" : "outline"}
                  onClick={handleToggleMyList}
                  className={`rounded-full px-6 h-14 flex-1 md:flex-none text-sm font-bold hidden md:flex transition-all hover:scale-105 ${
                    inMyList 
                      ? 'bg-foreground/20 text-foreground border-border hover:bg-foreground/30 backdrop-blur-xl' 
                      : 'bg-foreground/5 backdrop-blur-xl border-border text-foreground hover:bg-foreground/10'
                  }`}
                >
                  {inMyList ? <Check className="w-5 h-5 mr-2 text-primary" /> : <Star className="w-5 h-5 mr-2" />}
                  {inMyList ? "In My List" : "Add to List"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section id="player-section" className="relative z-20 pb-20 mt-4 md:mt-8">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Cast Section replacing the old inline player */}
          <CastSection cast={details.credits?.cast} />

          {type === 'anime' ? (
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl mt-8">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full" />
                Select Episode
              </h2>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Array.from({ length: animeEpisodesCount || 12 }).map((_, i) => {
                  const epNum = i + 1;
                  const isActive = selectedEpisode === epNum;
                  return (
                    <button
                      key={epNum}
                      onClick={() => handleEpisodeSelect(1, epNum)}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${
                        isActive
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                          : 'bg-zinc-800/50 border-white/5 hover:bg-zinc-700/50 hover:border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {epNum}
                    </button>
                  );
                })}
              </div>
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
              `}</style>
            </div>
          ) : isTV && details.seasons && (
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl mt-8">
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
