import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Sparkles, Tv, MonitorPlay, ListMusic } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/movies', label: 'Movies', icon: Film },
  { path: '/tv-shows', label: 'TV', icon: MonitorPlay },
  { path: '/live-tv', label: 'Live', icon: Tv },
  { path: '/playlist-player', label: 'Playlist', icon: ListMusic },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-50 md:hidden glass-card-heavy rounded-[2rem] px-4 py-2 shadow-2xl">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1.5 min-w-[3rem] transition-all duration-500 ${
                isActive
                  ? 'text-primary'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]' : ''} transition-all duration-500`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40 font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
