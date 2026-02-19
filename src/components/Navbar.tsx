import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Tv, Film, MonitorPlay, Home, Sparkles, Users, Menu, ListVideo, Clock, Download, BookOpen, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { SearchSuggestions } from './SearchSuggestions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getMyList } from '@/lib/myList';
import { getContinueWatching } from '@/lib/continueWatching';
import { toast } from 'sonner';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [myListCount, setMyListCount] = useState(0);
  const [continueWatchingCount, setContinueWatchingCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const location = useLocation();

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('To install: tap Share → Add to Home Screen');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Update counts when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      setMyListCount(getMyList().length);
      setContinueWatchingCount(getContinueWatching().length);
    }
  }, [isMenuOpen]);

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

          {/* Hamburger Menu, Search & Theme Toggle */}
          <div className="flex items-center gap-1">
            {/* Expandable Search Bar */}
            <div className={`flex items-center transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-64 md:w-80' : 'w-10'}`}>
              {isSearchOpen ? (
                <SearchSuggestions isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            <ThemeToggle />

            {/* Hamburger Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-2">
                  {/* My List */}
                  <Link
                    to="/my-list"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ListVideo className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">My List</p>
                        <p className="text-sm text-muted-foreground">
                          {myListCount} {myListCount === 1 ? 'item' : 'items'} saved
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Continue Watching */}
                  <Link
                    to="/continue-watching"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Continue Watching</p>
                        <p className="text-sm text-muted-foreground">
                          {continueWatchingCount} {continueWatchingCount === 1 ? 'item' : 'items'} in progress
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Free IPTV Player */}
                  <a
                    href="https://allplay-video-player.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">Free IPTV Player</p>
                        <p className="text-sm text-muted-foreground">
                          Play M3U8 & MPD streams
                        </p>
                      </div>
                    </div>
                  </a>


                  {/* Temp Mail */}
                  <Link
                    to="/temp-mail"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Temp Mail</p>
                        <p className="text-sm text-muted-foreground">
                          Disposable email inbox
                        </p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Install App</p>
                        <p className="text-sm text-muted-foreground">
                          {isInstallable ? 'Add to home screen' : 'Available offline'}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
