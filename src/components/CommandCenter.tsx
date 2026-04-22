import React, { useState, useEffect } from 'react';
import { useUnifiedPlayer } from '@/contexts/UnifiedPlayerContext';
import { useUnifiedSearch, UnifiedResult } from '@/hooks/useUnifiedSearch';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { fetchTrending, fetchPopularMovies, fetchPopularTV, getImageUrl, fetchMovieDetails, fetchTVDetails, fetchSeasonDetails } from '@/lib/tmdb';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Tv, 
  Film, 
  MonitorPlay, 
  Star, 
  History, 
  ChevronRight, 
  Play, 
  Loader2,
  ArrowLeft,
  X
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const CommandCenter = () => {
  const { isSidebarOpen, setIsSidebarOpen, setActiveMedia, activeMedia } = useUnifiedPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, isLoading: isSearching } = useUnifiedSearch(searchQuery);
  
  const { data: channels } = useChannels();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingTV, setTrendingTV] = useState<any[]>([]);
  const [activeTab, setActiveTab ] = useState('channels');
  
  // TV Series Detail State
  const [selectedSeries, setSelectedSeries] = useState<any | null>(null);
  const [seriesDetails, setSeriesDetails] = useState<any | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const [movies, tv] = await Promise.all([
          fetchPopularMovies(1),
          fetchPopularTV(1)
        ]);
        setTrendingMovies(movies);
        setTrendingTV(tv);
      } catch (error) {
        console.error('Failed to load discovery content:', error);
      }
    };
    loadTrending();
  }, []);

  const handleSelectMedia = (type: 'live' | 'movie' | 'tv', data: any, meta?: any) => {
    if (type === 'tv' && !meta) {
      handleOpenSeries(data);
      return;
    }
    setActiveMedia({ type, id: data.id, data, meta });
    setIsSidebarOpen(false);
    setSearchQuery('');
  };

  const handleOpenSeries = async (series: any) => {
    setSelectedSeries(series);
    setIsLoadingDetails(true);
    try {
      const details = await fetchTVDetails(series.id);
      setSeriesDetails(details);
      const season1 = await fetchSeasonDetails(series.id, 1);
      setEpisodes(season1.episodes);
      setSelectedSeason(1);
    } catch (error) {
      console.error('Failed to load series details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSeasonChange = async (seasonNum: number) => {
    if (!selectedSeries) return;
    setSelectedSeason(seasonNum);
    setIsLoadingDetails(true);
    try {
      const seasonData = await fetchSeasonDetails(selectedSeries.id, seasonNum);
      setEpisodes(seasonData.episodes);
    } catch (error) {
      console.error('Failed to load season:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 bg-black/95 backdrop-blur-2xl border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Background Highlight */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          
          <SheetHeader className="p-6 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black text-white italic tracking-tighter">
                COMMAND <span className="text-primary not-italic">CENTER</span>
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="rounded-full hover:bg-white/5">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Search Channels, Movies, TV..." 
                className="bg-white/5 border-white/10 rounded-2xl h-12 pl-12 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {searchQuery ? (
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Search Results</p>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectMedia(result.type, result.data)}
                      className="w-full group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left"
                    >
                      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0 relative">
                        {result.poster_path ? (
                          <img 
                            src={result.type === 'live' ? result.poster_path : getImageUrl(result.poster_path, 'w200')} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {result.type === 'live' ? <Tv className="h-6 w-6 text-zinc-700" /> : <Film className="h-6 w-6 text-zinc-700" />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-6 w-6 text-black fill-black" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[8px] uppercase tracking-widest py-0 px-1.5 border-white/10 text-zinc-500">
                            {result.type}
                          </Badge>
                        </div>
                        <h4 className="font-black text-white text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">
                          {result.title}
                        </h4>
                      </div>
                    </button>
                  ))}
                  {searchResults.length === 0 && !isSearching && (
                    <div className="py-12 text-center">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No signals found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedSeries ? (
              /* TV Series Detail View */
              <div className="p-6 space-y-6">
                <button 
                  onClick={() => setSelectedSeries(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Discover
                </button>
                
                <div className="flex gap-4">
                  <div className="w-24 h-36 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={getImageUrl(selectedSeries.poster_path)} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                      {selectedSeries.name || selectedSeries.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-primary text-black font-black text-[9px] py-0 px-2 uppercase italic">
                        TV SERIES
                      </Badge>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {seriesDetails?.first_air_date?.split('-')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Select Season</p>
                    {seriesDetails?.seasons && (
                      <select 
                        className="bg-zinc-900 border-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-1 outline-none focus:border-primary/50 text-white"
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(Number(e.target.value))}
                      >
                        {seriesDetails.seasons.filter((s:any) => s.season_number > 0).map((s:any) => (
                          <option key={s.id} value={s.season_number}>Season {s.season_number}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    {isLoadingDetails ? (
                      <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
                    ) : (
                      episodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => handleSelectMedia('tv', selectedSeries, { season: selectedSeason, episode: ep.episode_number })}
                          className="w-full group bg-white/[0.02] hover:bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-4 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs text-zinc-500 group-hover:bg-primary group-hover:text-black transition-all">
                            {ep.episode_number}
                          </div>
                          <div className="flex-1 text-left">
                            <h5 className="font-bold text-xs text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                              {ep.name || `Episode ${ep.episode_number}`}
                            </h5>
                          </div>
                          <Play className="h-4 w-4 text-zinc-700 group-hover:text-primary group-hover:fill-primary" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Discovery Mode */
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-transparent p-6 pb-0 grid grid-cols-3 gap-2">
                  <TabsTrigger value="channels" className="rounded-xl h-10 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[9px]">
                    LIVE TV
                  </TabsTrigger>
                  <TabsTrigger value="movies" className="rounded-xl h-10 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[9px]">
                    MOVIES
                  </TabsTrigger>
                  <TabsTrigger value="series" className="rounded-xl h-10 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[9px]">
                    SERIES
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="channels" className="p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Broadcast Network</p>
                  <div className="grid grid-cols-2 gap-3">
                    {channels?.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectMedia('live', toAppChannel(channel))}
                        className="group flex flex-col items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/20 transition-all"
                      >
                         <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 relative">
                            {channel.logo_url ? (
                              <img src={channel.logo_url} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Tv className="h-8 w-8 text-zinc-800" />
                              </div>
                            )}
                         </div>
                         <h5 className="font-black text-[9px] text-zinc-400 uppercase tracking-tight text-center truncate w-full group-hover:text-white transition-colors">
                           {channel.name}
                         </h5>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="movies" className="p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Popular Cinema</p>
                   <div className="grid grid-cols-2 gap-3">
                    {trendingMovies.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => handleSelectMedia('movie', movie)}
                        className="group flex flex-col gap-2 transition-all"
                      >
                         <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 relative shadow-xl">
                            <img src={getImageUrl(movie.poster_path, 'w300')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <Play className="h-8 w-8 text-primary" />
                            </div>
                         </div>
                         <h5 className="font-black text-[10px] text-zinc-400 uppercase tracking-tight line-clamp-1 group-hover:text-white transition-colors">
                           {movie.title}
                         </h5>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="series" className="p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Trending Series</p>
                  <div className="grid grid-cols-2 gap-3">
                    {trendingTV.map((show) => (
                      <button
                        key={show.id}
                        onClick={() => handleOpenSeries(show)}
                        className="group flex flex-col gap-2 transition-all text-left"
                      >
                         <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 relative shadow-xl">
                            <img src={getImageUrl(show.poster_path, 'w300')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <ChevronRight className="h-8 w-8 text-primary" />
                            </div>
                         </div>
                         <h5 className="font-black text-[10px] text-zinc-400 uppercase tracking-tight line-clamp-1 group-hover:text-white transition-colors">
                           {show.name}
                         </h5>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>

          {/* Footer Utility */}
          <div className="p-6 border-t border-white/5 bg-black/50 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="rounded-xl h-11 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400"
                onClick={() => { window.location.href = '/auth'; setIsSidebarOpen(false); }}
              >
                ACCOUNT
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl h-11 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400"
                onClick={() => { window.location.href = '/admin'; setIsSidebarOpen(false); }}
              >
                ADMIN
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
