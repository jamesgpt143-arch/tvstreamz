import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Sparkles, Tv, MonitorPlay, Bot } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/movies', label: 'Movies', icon: Film },
  { path: '/tv-shows', label: 'TV', icon: MonitorPlay },
  { path: '/anime', label: 'Anime', icon: Sparkles },
  { path: '/live-tv', label: 'Live', icon: Tv },
  { path: '/ai', label: 'AI Chat', icon: Bot },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[60] lg:hidden bg-background/90 backdrop-blur-md border border-border rounded-[2rem] shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2 relative overflow-hidden rounded-[2rem]">
        {/* Ambient Bottom Glow */}
        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[80%] h-10 bg-primary/20 blur-2xl pointer-events-none" />
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path)) ||
            (item.path === '/movies' && (location.pathname.startsWith('/watch/movie') || location.pathname.startsWith('/play/movie'))) ||
            (item.path === '/tv-shows' && (location.pathname.startsWith('/watch/tv') || location.pathname.startsWith('/play/tv'))) ||
            (item.path === '/anime' && (location.pathname.startsWith('/watch/anime') || location.pathname.startsWith('/play/anime'))) ||
            (item.path === '/live-tv' && location.pathname.startsWith('/live/'));
          
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
      </div>
    </nav>
  );
};
