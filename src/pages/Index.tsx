import { useEffect, useState } from 'react';
import gcashQr from '@/assets/gcash-qr.jpg';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ContinueWatchingRow } from '@/components/ContinueWatchingRow';
import { ContentRow } from '@/components/ContentRow';
import { ChannelCard } from '@/components/ChannelCard';
import { RecommendationsRow } from '@/components/RecommendationsRow';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { WelcomePopup } from '@/components/WelcomePopup';
import { useChannels, toAppChannel } from '@/hooks/useChannels';
import { trackPageView } from '@/lib/analytics';
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
  const { data: dbChannels } = useChannels();
  const liveChannels = (dbChannels || []).map(toAppChannel);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/30">
      <WelcomePopup />
      <Navbar />
      
      <main className="relative">
        <HeroSection items={trending} />

        {/* Content Overlay Section */}
        <div className="relative -mt-12 z-20 pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-4 md:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <ContinueWatchingRow />
              <RecommendationsRow />
              
              <ContentRow 
                title="🔥 Trending Now" 
                items={trending} 
                isTrending={true}
              />
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-8" />
              
              <ContentRow title="🎬 Now Playing" items={nowPlaying} type="movie" />
              <ContentRow title="🎥 Popular Movies" items={popularMovies} type="movie" />
              <ContentRow title="📺 Popular TV Shows" items={popularTV} type="tv" />
              <ContentRow title="⭐ Top Rated" items={topRated} type="movie" />

              {/* Live TV Preview - Redesigned */}
              <section className="py-12 animate-reveal">
                <div className="container mx-auto">
                  <div className="flex items-end justify-between mb-8">
                    <div className="space-y-1">
                       <div className="h-1 w-12 bg-primary rounded-full mb-2" />
                       <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em]">📡 Live TV</h2>
                    </div>
                    <Link
                      to="/live-tv"
                      className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      Explore All Channels
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {liveChannels.slice(0, 4).map((channel) => (
                      <div key={channel.id} className="hover:scale-105 transition-transform duration-500">
                        <ChannelCard channel={channel} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Supporters Footer */}
      <footer className="relative py-20 overflow-hidden bg-[#09090b]">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-2xl bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl shadow-2xl">
            <h3 className="text-3xl font-black mb-4 tracking-tight">Support Our <span className="text-primary italic">Community</span></h3>
            <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
              Help us keep the servers running and the content fresh. Your donations directly support our platform growth.
            </p>
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative group cursor-pointer inline-block">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src={gcashQr} 
                    alt="GCash QR Code" 
                    className="w-32 h-32 rounded-3xl shadow-2xl relative z-10 transition-all group-hover:scale-110 active:scale-95 border border-white/10"
                  />
                  <div className="mt-4 text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">TAP TO ENLARGE</div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-sm bg-zinc-950 border-white/10 p-6 rounded-[2.5rem]">
                <img 
                  src={gcashQr} 
                  alt="GCash QR Code" 
                  className="w-full h-auto rounded-[2rem] border border-white/10 shadow-2xl"
                />
                <div className="text-center mt-6">
                   <p className="text-white font-black text-xl mb-1">SCAN TO DONATE</p>
                   <p className="text-zinc-500 text-xs">Thank you for your incredible support!</p>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0">
               <div className="text-[10px] font-black tracking-widest">VISA</div>
               <div className="text-[10px] font-black tracking-widest">MASTERCARD</div>
               <div className="text-[10px] font-black tracking-widest">GCASH</div>
               <div className="text-[10px] font-black tracking-widest">PAYPAL</div>
            </div>
          </div>
          
          <div className="mt-20 text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em] opacity-50">
            TVStreamz Platform • Advanced Core v2.4
          </div>
        </div>
      </footer>

      <SiteAnalytics />
    </div>
  );
};

export default Index;
