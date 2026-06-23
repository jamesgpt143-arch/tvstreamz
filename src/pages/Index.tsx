import { useEffect, useState } from 'react';
import { Play, Info, Search, Bookmark, Plus, Sparkles, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { HeaderSearch } from '@/components/SearchSuggestions';
import { NotificationBell } from '@/components/NotificationBell';
import { useProxyLogo } from '@/hooks/useProxyLogo';
import { useUserPreferencesContext } from '@/contexts/UserPreferencesContext';
import { trackPageView } from '@/lib/analytics';
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTV,
  fetchTopRatedMovies,
  fetchNowPlaying,
  Movie,
  TVShow,
  getImageUrl
} from '@/lib/tmdb';
import { RecommendationsRow } from '@/components/RecommendationsRow';
import { ContentRow } from '@/components/ContentRow';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";

const Index = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<TVShow[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const { data: dbChannels } = useChannels();
  const liveChannels = (dbChannels || []).map(toAppChannel);
  const { proxyLogo } = useProxyLogo();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackPageView('/');
    
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

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [trendingPage, setTrendingPage] = useState(0);

  useEffect(() => {
    if (!carouselApi || popularTV.length === 0) return;
    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselApi, popularTV]);

  const { myList } = useUserPreferencesContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get items for the complex layout
  // Make recommendations dynamic based on user history length
  const allContent = [...popularMovies, ...topRated, ...trending, ...popularTV];
  const uniqueContent = Array.from(new Map(allContent.map(item => [item.id, item])).values());
  const recommendedItems = uniqueContent
    .filter(item => !myList.some(m => String(m.id) === String(item.id)))
    .slice(myList.length % 10, (myList.length % 10) + 5);

  const itemsPerPage = 6;
  const maxTrendingPages = Math.ceil(trending.length / itemsPerPage);
  const trendingGridItems = trending.slice(trendingPage * itemsPerPage, trendingPage * itemsPerPage + itemsPerPage);

  const nextTrendingPage = () => setTrendingPage(prev => (prev + 1) % maxTrendingPages);
  const prevTrendingPage = () => setTrendingPage(prev => (prev - 1 + maxTrendingPages) % maxTrendingPages);

  return (
    <div className="min-h-screen bg-background text-foreground">
       
       {/* Dashboard Container - Natural height to prevent clipping on small laptops */}
       <div className="flex flex-col pb-4">
         
         {/* Top Header */}
         <header className="flex-none flex items-center justify-between px-6 lg:px-8 py-4 lg:py-6">
           <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Home</h1>
           <div className="flex items-center gap-4">
             <HeaderSearch />
             <NotificationBell />
           </div>
         </header>

         {/* 2-COLUMN BENTO GRID LAYOUT */}
         <main className="flex-1 px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN (Continue Watching + Sub Widgets) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
               
               {/* Featured Section */}
               {popularTV.length > 0 && (
                 <div className="flex flex-col gap-3">
                   <Carousel 
                     opts={{ align: "center", loop: true }}
                     setApi={setCarouselApi}
                     className="w-full relative"
                   >
                     <CarouselContent className="-ml-2 md:-ml-4">
                       {popularTV.slice(0, 10).map((heroItem) => (
                         <CarouselItem key={heroItem.id} className="pl-2 md:pl-4 basis-[85%] md:basis-[90%] lg:basis-[100%]">
                           {/* Main Hero Thumbnail (Featured Movie Style) */}
                           <div className="relative rounded-[1.25rem] overflow-hidden h-[240px] lg:h-[320px] 2xl:h-[360px] group cursor-pointer shadow-2xl border border-border">
                             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${getImageUrl(heroItem.backdrop_path, 'original')})` }} />
                             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                             
                             {/* Top Badges */}
                             <div className="absolute top-4 left-5 flex gap-2 hidden sm:flex">
                                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-lg">Sci-Fi</span>
                                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-lg">Drama</span>
                             </div>
                             <div className="absolute top-4 right-5">
                                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-lg">Trending</span>
                             </div>

                             {/* Main Content */}
                             <div className="absolute inset-y-0 left-0 w-[95%] sm:w-[85%] lg:w-[70%] px-5 pb-5 pt-10 lg:px-8 lg:pb-8 lg:pt-12 flex flex-col justify-end">
                               <h3 className="text-2xl lg:text-3xl 2xl:text-4xl font-black mb-2 drop-shadow-lg leading-tight tracking-tight text-white line-clamp-2">{heroItem.name || heroItem.title}</h3>
                               <p className="text-xs text-white/80 mb-4 drop-shadow-md line-clamp-2 leading-relaxed hidden sm:block">
                                 {heroItem.overview || "Returning home awakens memories rekindles love, and restores a deep sense of belonging within."}
                               </p>

                               <div className="flex items-center gap-3">
                                 <Link to={`/watch/tv/${heroItem.id}`} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(77,242,214,0.3)] w-max">
                                   <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                                 </Link>
                                 <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors border border-white/5">
                                   <Plus className="w-4 h-4" /> My List
                                 </button>
                               </div>
                             </div>
                           </div>
                         </CarouselItem>
                       ))}
                     </CarouselContent>
                   </Carousel>
                 </div>
               )}

               {/* YOU MIGHT LIKE SECTION (Bento Grid) */}
               <div className="bg-card rounded-[1.5rem] p-5 border border-border shadow-xl flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-foreground">You might like</h2>
                 </div>
                 
                 <div className="grid grid-cols-6 grid-rows-2 gap-3 lg:gap-4 flex-1">
                    {recommendedItems.slice(0, 5).map((show, idx) => {
                      const isTopRow = idx < 2;
                      const colSpan = isTopRow ? "col-span-3" : "col-span-2";
                      const staticGenres = ["Action", "Mystery", "Fantasy", "Sci-Fi", "Drama"];

                      return (
                        <Link to={`/watch/tv/${show.id}`} key={show.id} className={`${colSpan} relative rounded-[1rem] overflow-hidden group border border-border shadow-md min-h-[100px] flex flex-col justify-end`}>
                           <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${getImageUrl(show.backdrop_path, 'w500')})` }} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                           
                           {/* Content Overlay */}
                           <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4 flex flex-col">
                             <span className="px-2 py-0.5 lg:py-1 rounded-full bg-black/40 backdrop-blur-md text-[8px] lg:text-[9px] font-semibold text-white/90 border border-white/10 self-start mb-1 lg:mb-2">{staticGenres[idx % staticGenres.length]}</span>
                             <h3 className="text-xs lg:text-sm font-bold truncate drop-shadow-md text-white mb-0.5">{show.name}</h3>
                             <p className={`text-[8px] lg:text-[9px] text-zinc-400 line-clamp-1 lg:line-clamp-2 leading-snug pr-6 lg:pr-8 drop-shadow-md ${!isTopRow ? 'hidden sm:block line-clamp-1' : ''}`}>
                               {show.overview}
                             </p>
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
            </div>

            {/* RIGHT COLUMN (Trending Now) */}
            <div className="lg:col-span-4 bg-card rounded-[1.5rem] p-5 border border-border shadow-xl flex flex-col h-full">
               <div className="flex justify-between items-center text-sm font-bold text-foreground mb-6">
                  <h2 className="uppercase tracking-wide">Trending Now</h2>
                  <div className="flex items-center gap-2">
                     <button onClick={prevTrendingPage} className="w-6 h-6 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors border border-border">
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                     </button>
                     <button onClick={nextTrendingPage} className="w-6 h-6 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors border border-border">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                     </button>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 lg:grid-cols-2 gap-3 lg:gap-4 pb-4">
                  {trendingGridItems.map(item => (
                    <Link to={`/watch/${item.media_type || 'movie'}/${item.id}`} key={item.id} className="rounded-xl overflow-hidden relative group aspect-[2/3] border border-border shadow-md">
                       <img src={getImageUrl(item.poster_path, 'w500')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
                          <h3 className="text-sm font-bold truncate drop-shadow-md text-white mb-0.5">{item.title || item.name}</h3>
                          <p className="text-[11px] text-green-500 font-bold drop-shadow-md">{Math.floor(Math.random() * 5 + 95)}% Match</p>
                       </div>
                    </Link>
                  ))}
               </div>
            </div>
         </main>
       </div>

       {/* SCROLLABLE ROWS BELOW DASHBOARD */}
       <div className="px-6 lg:px-8 py-12 space-y-12 bg-background">
          <RecommendationsRow />
          <ContentRow title="🎬 Now Playing" items={nowPlaying} type="movie" />
          <ContentRow title="🎥 Popular Movies" items={popularMovies} type="movie" />
       </div>

    </div>
  );
};

export default Index;
