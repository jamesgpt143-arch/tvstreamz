import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { fetchMovieDetails, fetchTVDetails, getStreamingUrls, MovieDetails, getImageUrl, findTMDBIdByTitle, fetchTrending, fetchRecommendations, fetchSimilar, Movie } from '@/lib/tmdb';
import { getAnimeById, getAnimeAiredEpisodes, getMalIdFromTitle, fetchAnimeList, fetchAnimeRecommendations } from '@/lib/anime-db';
import { updateWatchProgress, getWatchProgress } from '@/lib/continueWatching';
import { trackPageView, trackContentView } from '@/lib/analytics';
import { Loader2, ChevronLeft, ChevronRight, Play, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const Player = () => {
  const navigate = useNavigate();
  // We can handle both /play/:type/:id and /play/:type/:id/:season/:episode
  const { type, id, season, episode } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string; season?: string; episode?: string }>();
  
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSeason, setSelectedSeason] = useState(season ? parseInt(season) : 1);
  const [selectedEpisode, setSelectedEpisode] = useState(episode ? parseInt(episode) : 1);
  const [currentServer, setCurrentServer] = useState<string | undefined>(undefined);
  
  const [isDub, setIsDub] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [searchEp, setSearchEp] = useState("");
  
  const [resolvedMalId, setResolvedMalId] = useState<string | undefined>(undefined);
  const [animeEpisodesCount, setAnimeEpisodesCount] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !type) return;
      setIsLoading(true);
      trackPageView(`/play/${type}/${id}`);

      try {
        let contentData: MovieDetails | null = null;
        let effectiveType = type;
        let effectiveId = id;
        let finalMalId = type === 'anime' ? id : undefined;

        if (type === 'anime') {
          const animeData = await getAnimeById(id!);
          let airedEpisodes = animeData.episodes;
          if (animeData.status === 'Currently Airing' || !airedEpisodes) {
            const anilistAired = await getAnimeAiredEpisodes(id!);
            if (anilistAired) airedEpisodes = anilistAired;
          }
          setAnimeEpisodesCount(airedEpisodes || 12);

          let tmdbMatch = await findTMDBIdByTitle(animeData.title);
          if (!tmdbMatch && animeData.alternativeTitles?.length > 0) {
            for (const altTitle of animeData.alternativeTitles) {
              if (!altTitle) continue;
              tmdbMatch = await findTMDBIdByTitle(altTitle);
              if (tmdbMatch) break;
            }
          }
          
          if (tmdbMatch) {
            effectiveType = tmdbMatch.type;
            effectiveId = tmdbMatch.id.toString();
            contentData = effectiveType === 'movie' 
              ? await fetchMovieDetails(tmdbMatch.id)
              : await fetchTVDetails(tmdbMatch.id);
            
            contentData.title = animeData.title;
            contentData.overview = animeData.synopsis || contentData.overview;
          } else {
            toast.error("Could not find streaming sources for this anime.");
          }
        } else {
          contentData = type === 'movie' 
            ? await fetchMovieDetails(Number(id))
            : await fetchTVDetails(Number(id));
            
          const isJapaneseAnimation = (contentData as any).original_language === 'ja' && contentData.genres?.some((g: any) => g.id === 16);
          if (isJapaneseAnimation) {
            try {
              const animeTitle = contentData.name || contentData.title || '';
              finalMalId = await getMalIdFromTitle(animeTitle) || undefined;
              if (!finalMalId) {
                const jikanResult = await fetchAnimeList(1, 3, animeTitle);
                if (jikanResult.data && jikanResult.data.length > 0) {
                  finalMalId = jikanResult.data[0].mal_id.toString();
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
        }

        if (!contentData) throw new Error("Content not found");
        
        setResolvedMalId(finalMalId || undefined);
        setDetails(contentData);
        trackContentView(effectiveId!, effectiveType!, contentData.title || contentData.name || '');

        // Fetch Similar
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
        setSimilar(trending.filter((item: any) => item.id !== Number(id) && item.mal_id !== Number(id)).slice(0, 5));

        const existingProgress = getWatchProgress(contentData.id, effectiveType as 'movie' | 'tv');
        if (existingProgress && !season && !episode) {
           if (type === 'tv' || type === 'anime') {
              setSelectedSeason(existingProgress.season || 1);
              setSelectedEpisode(existingProgress.episode || 1);
           }
           setCurrentServer(existingProgress.lastServer);
        }

      } catch (error) {
        console.error('Failed to load details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, type]);

  // Background Progress Timer
  useEffect(() => {
    if (!details || isLoading || !type) return;

    const interval = setInterval(() => {
      const progress = getWatchProgress(details.id, type as 'movie' | 'tv');
      const runtime = details.runtime || (details.episode_run_time?.[0] ?? 90);
      const totalDuration = runtime * 60;
      
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

  const handleEpisodeSelect = (s: number, e: number) => {
    setSelectedSeason(s);
    setSelectedEpisode(e);
    
    // Update URL without full reload
    navigate(`/play/${type}/${id}/${s}/${e}`, { replace: true });
    
    if (details) {
      const runtime = details.episode_run_time?.[0] ?? 45;
      updateWatchProgress({
        id: details.id,
        type: type as 'movie' | 'tv',
        title: details.title || details.name || '',
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        progress: 5,
        currentTime: 0,
        duration: runtime * 60,
        season: s,
        episode: e,
        lastServer: currentServer,
      });
    }
  };

  const handleSearchEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const ep = parseInt(searchEp);
    if (!isNaN(ep) && ep > 0 && ep <= totalEps) {
      handleEpisodeSelect(selectedSeason, ep);
      setSearchEp("");
    } else {
      toast.error(`Please enter a valid episode number (1 - ${totalEps})`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Content not found</h1>
          <Button asChild><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  const isTV = type === 'tv' || (type === 'anime' && details?.seasons && details.seasons.length > 0) || animeEpisodesCount;
  const servers = (type === 'movie' || (type === 'anime' && !isTV))
    ? getStreamingUrls(details.id, 'movie', undefined, undefined, resolvedMalId, isDub)
    : getStreamingUrls(details.id, 'tv', selectedSeason, selectedEpisode, resolvedMalId, isDub);

  const title = details.title || details.name || '';
  const totalEps = animeEpisodesCount || (details.seasons?.find(s => s.season_number === selectedSeason)?.episode_count) || 1;

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-12 px-4 lg:px-8 max-w-[1600px] mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className="mb-4 -ml-2 text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Details
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Video Player Area */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Player Header (Now Playing, Auto Next, Sub/Dub) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
              <div>
                <h1 className="text-xl md:text-2xl font-black">
                  {type === 'movie' ? title : `Episode ${selectedEpisode}`}
                </h1>
                {type !== 'movie' && (
                  <p className="text-sm text-zinc-400">{title} • Season {selectedSeason}</p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4">

                
                {resolvedMalId && (
                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                    <button 
                      onClick={() => setIsDub(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${!isDub ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      SUB
                    </button>
                    <button 
                      onClick={() => setIsDub(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${isDub ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      DUB
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Server Selection */}
            {true && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Select Server</span>
                </div>
                <div className="w-full sm:w-[250px]">
                  <Select value={currentServer || Object.keys(servers || {})[0]} onValueChange={setCurrentServer}>
                    <SelectTrigger className="w-full bg-black/50 border-white/10 text-white h-10">
                      <SelectValue placeholder="Choose server" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {Object.entries(servers || {}).map(([name]) => (
                        <SelectItem key={name} value={name} className="text-sm">
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-medium">{name}</span>
                            {name === 'Server 3' && (
                              <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Ad-Free
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Video Player */}
            <VideoPlayer 
              servers={servers} 
              title={title} 
              initialServer={currentServer}
              onServerChange={setCurrentServer}
            />

            {/* MORE LIKE THIS (Bento Grid) */}
            {similar.length > 0 && (
               <div className="bg-card rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col mt-2">
                 <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">More Like This</h2>
                 <div className="grid grid-cols-6 grid-rows-2 gap-3 lg:gap-4 flex-1">
                    {similar.map((show, idx) => {
                      const isTopRow = idx < 2;
                      const colSpan = isTopRow ? "col-span-3" : "col-span-2";
                      return (
                        <Link to={`/watch/${type}/${show.id}`} key={show.id} className={`${colSpan} relative rounded-xl overflow-hidden group border border-white/5 shadow-md min-h-[120px] md:min-h-[160px] flex flex-col justify-end`}>
                           <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${getImageUrl(show.backdrop_path, 'w500')})` }} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                           
                           {/* Content Overlay */}
                           <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4 flex flex-col">
                             <h3 className="text-xs lg:text-sm font-bold truncate drop-shadow-md text-white mb-0.5">{show.title || show.name}</h3>
                           </div>

                           {/* Play Button */}
                           <div className="absolute bottom-3 right-3 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors shadow-lg">
                              <Play className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 fill-white text-white ml-0.5" />
                           </div>
                        </Link>
                      );
                    })}
                 </div>
               </div>
            )}
          </div>

          {/* RIGHT: Side Panel */}
          <div className="w-full lg:w-[350px] shrink-0">
            
            {type === 'movie' || !isTV ? (
              /* Movie Details Panel */
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm sticky top-24">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  Movie Details
                </h2>
                
                <img 
                  src={getImageUrl(details.poster_path, 'w500')} 
                  alt={title} 
                  className="w-full aspect-[2/3] object-cover rounded-xl mb-4 shadow-lg border border-white/10"
                />
                
                <h3 className="font-bold text-lg leading-tight mb-2">{title}</h3>
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-500 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  {(details.vote_average || 0).toFixed(1)} / 10
                </div>
                
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-6">
                  {details.overview}
                </p>

                

                <Button 
                  className="w-full mt-6 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border"
                  onClick={() => navigate(`/watch/movie/${id}`)}
                >
                  View Full Page
                </Button>
              </div>
            ) : (
              /* Episode Picker Panel */
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-[600px] sticky top-24">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    Episodes
                  </h2>
                  
                  {type === 'tv' && details.seasons && (
                    <Select value={selectedSeason.toString()} onValueChange={(val) => handleEpisodeSelect(parseInt(val), 1)}>
                      <SelectTrigger className="w-full bg-black/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {details.seasons.filter(s => s.season_number > 0).map(s => (
                          <SelectItem key={s.id} value={s.season_number.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Search / Go to Episode */}
                  <form onSubmit={handleSearchEpisode} className="relative mt-4">
                    <input 
                      type="number"
                      value={searchEp}
                      onChange={(e) => setSearchEp(e.target.value)}
                      placeholder="Search Ep #"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                      <Search className="w-4 h-4" />
                    </button>
                  </form>
                </div>                
  {/* Big Episode Selector (like AniStreamz UI) */}
                <div className="flex-1 flex flex-col items-center justify-center border-y border-white/10 py-8 my-2">
                  <p className="text-sm text-zinc-400 font-medium tracking-widest uppercase mb-4">Episode</p>
                  
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleEpisodeSelect(selectedSeason, Math.max(1, selectedEpisode - 1))}
                      disabled={selectedEpisode <= 1}
                      className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-10 h-10" />
                    </button>
                    
                    <div className="w-24 h-28 bg-zinc-800/80 rounded-2xl border border-white/10 flex flex-col items-center justify-center shadow-xl shadow-black/50">
                      <span className="text-4xl font-black">{selectedEpisode}</span>
                      <span className="text-[10px] font-bold text-primary tracking-widest mt-2 bg-primary/20 px-2 py-0.5 rounded-full">PLAYING</span>
                    </div>

                    <button 
                      onClick={() => handleEpisodeSelect(selectedSeason, Math.min(totalEps, selectedEpisode + 1))}
                      disabled={selectedEpisode >= totalEps}
                      className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-10 h-10" />
                    </button>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-1">Total Episodes</p>
                    <p className="text-3xl font-black text-zinc-500">{totalEps}</p>
                  </div>
                </div>
                
              </div>
            )}

          </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
};

export default Player;
