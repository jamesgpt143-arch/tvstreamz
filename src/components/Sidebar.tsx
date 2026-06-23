import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Tv, Film, MonitorPlay, Home, Sparkles, Shield, ListVideo, ListMusic, Mail, LogOut, User, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from 'next-themes';
export const Sidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { myList } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin) {
            setIsLoggedIn(true);
            setIsAdmin(true);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch auth");
      }
      setIsLoggedIn(false);
      setIsAdmin(false);
    };
    checkAuth();
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/tv-shows', label: 'TV Shows', icon: MonitorPlay },
    { path: '/anime', label: 'Anime', icon: Sparkles },
    { path: '/live-tv', label: 'Live TV', icon: Tv },
  ];

  const handleLogout = async () => {
    // Clear cookie
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-background/90 backdrop-blur-md border-r border-border z-50 p-6 overflow-y-auto custom-scrollbar shadow-xl">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-4 group mb-12">
        <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-110 shrink-0">
          <Tv className="w-6 h-6 text-white" fill="white" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          STREAMZ
        </span>
      </Link>

      {/* Main Navigation */}
      <div className="space-y-2 mb-10">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 pl-2">Menu</p>
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
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-br from-primary/30 via-white/10 to-secondary/30 backdrop-blur-xl text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_20px_rgba(0,0,0,0.1)] border border-white/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </div>


      {/* Library */}
      <div className="space-y-2 mb-auto">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 pl-2">Library</p>
        
        <Link to="/my-list" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
          <ListVideo className="w-5 h-5" />
          My List
          <span className="ml-auto bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-black">{myList.length}</span>
        </Link>
        <Link to="/playlist-player" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
          <ListMusic className="w-5 h-5" />
          Playlist Player
        </Link>
        <Link to="/temp-mail" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
          <Mail className="w-5 h-5" />
          Temp Mail
        </Link>
      </div>

      {/* User Section */}
      <div className="mt-8 pt-6 border-t border-border">
        
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-4 px-4 py-3 mb-4 w-full rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        {!isLoggedIn ? (
          <Button asChild className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-black uppercase tracking-widest border-0">
            <Link to="/auth">Sign In</Link>
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-black shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-foreground truncate">Premium User</p>
                <p className="text-[10px] text-muted-foreground">Active Account</p>
              </div>
            </div>
            
            {isAdmin && (
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 bg-foreground/5 border-border hover:bg-foreground/10 text-foreground">
                <Link to="/admin">
                  <Shield className="w-4 h-4 text-primary" />
                  Admin Console
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};
