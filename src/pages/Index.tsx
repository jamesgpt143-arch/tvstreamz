import { useEffect } from 'react';
import { WelcomePopup } from '@/components/WelcomePopup';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { trackPageView } from '@/lib/analytics';
import { UnifiedPlayer } from '@/components/UnifiedPlayer';
import { CommandCenter } from '@/components/CommandCenter';
import { useUnifiedPlayer } from '@/contexts/UnifiedPlayerContext';
import { Menu, Play, Info, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { setIsSidebarOpen, activeMedia } = useUnifiedPlayer();

  useEffect(() => {
    trackPageView('/');
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-primary/30 overflow-hidden font-sans uppercase">
      <WelcomePopup />
      
      {/* Main Player Layer */}
      <div className="absolute inset-0 z-0">
        <UnifiedPlayer />
      </div>

      {/* UI Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        {/* Top Header */}
        <div className="flex items-center justify-between pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 hover:bg-primary hover:text-black transition-all duration-500 group shadow-2xl"
          >
            <Menu className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </Button>

          <div className="hidden md:flex items-center gap-6">
             {/* Network status removed as per user request */}
          </div>
        </div>

        {/* Bottom Title Overlay */}
        {activeMedia && (
          <div className="animate-reveal pointer-events-none">
             <div className="space-y-4">
                <h1 className="text-xl md:text-4xl font-black text-white/40 tracking-tighter italic leading-none drop-shadow-2xl">
                  {activeMedia.data.title || activeMedia.data.name}
                </h1>
                
                {activeMedia.type === 'tv' && activeMedia.meta && (
                  <p className="text-primary/40 font-black text-[10px] tracking-widest uppercase">
                    S{activeMedia.meta.season} E{activeMedia.meta.episode}
                  </p>
                )}
             </div>
          </div>
        )}

        {!activeMedia && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Play className="h-12 w-12 text-primary/20 animate-pulse" />
            <p className="text-[10px] font-black text-primary tracking-[0.6em] animate-pulse">INITIATING CORE SYSTEM</p>
          </div>
        )}
      </div>

      {/* Sidebar Component */}
      <CommandCenter />
      
      <SiteAnalytics />
    </div>
  );
};

export default Index;
