import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Tv, Film, MonitorPlay, Home, Sparkles, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { SearchSuggestions } from './SearchSuggestions';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const location = useLocation();

  // Site-wide presence tracking
  useEffect(() => {
    const sessionId = `user_${Math.random().toString(36).substring(2, 15)}`;
    
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/tv-shows', label: 'TV Shows', icon: MonitorPlay },
    { path: '/anime', label: 'Anime', icon: Sparkles },
    { path: '/live-tv', label: 'Live TV', icon: Tv },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Online Counter */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">MovieStreamz</span>
            </Link>
            
            {/* Online Counter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tabular-nums">
                {onlineCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">online</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Search & Theme Toggle */}
          <div className="flex items-center gap-1">
            {isSearchOpen ? (
              <SearchSuggestions isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
