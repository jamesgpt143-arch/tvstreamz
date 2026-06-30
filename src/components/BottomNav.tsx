import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Sparkles, Tv, MonitorPlay, Bot, MoreHorizontal, MessageCircle, Mail, Volume2, X, Search } from 'lucide-react';

const mainNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/movies', label: 'Movies', icon: Film },
  { path: '/tv-shows', label: 'TV', icon: MonitorPlay },
  { path: '/anime', label: 'Anime', icon: Sparkles },
  { path: '/live-tv', label: 'Live', icon: Tv },
];

const moreItems = [
  { path: '/ai', label: 'Streamz AI', icon: Bot, color: 'text-primary' },
  { path: '/chat', label: 'Global Chat', icon: MessageCircle, color: 'text-green-500' },
  { path: '/temp-mail', label: 'Temp Mail', icon: Mail, color: 'text-blue-400' },
  { path: '/text-to-speech', label: 'Text to Speech', icon: Volume2, color: 'text-orange-400' },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[59] lg:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div 
            className="absolute bottom-24 left-4 right-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-foreground">More Tools</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/50 hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-[60] lg:hidden bg-background/90 backdrop-blur-md border border-border rounded-[2rem] shadow-2xl">
        <div className="flex items-center justify-around h-16 px-2 relative overflow-hidden rounded-[2rem]">
          {/* Ambient Bottom Glow */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[80%] h-10 bg-primary/20 blur-2xl pointer-events-none" />
          
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path)) ||
              (item.path === '/movies' && (location.pathname.startsWith('/watch/movie') || location.pathname.startsWith('/play/movie'))) ||
              (item.path === '/tv-shows' && (location.pathname.startsWith('/watch/tv') || location.pathname.startsWith('/play/tv'))) ||
              (item.label === 'Anime' && (location.pathname.startsWith('/watch/anime') || location.pathname.startsWith('/play/anime'))) ||
              (item.label === 'Live' && location.pathname.startsWith('/live/'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 relative z-10 ${
                  isActive
                    ? 'text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                    : 'text-muted-foreground hover:text-primary/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 relative z-10 ${
              showMore || isMoreActive
                ? 'text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                : 'text-muted-foreground hover:text-primary/70'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${showMore ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
