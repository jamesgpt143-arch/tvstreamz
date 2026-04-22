import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Tv, Film, MonitorPlay, Home, Sparkles, Users, Menu, ListVideo, Clock, Mail, Shield, MonitorUp, ListMusic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { SearchSuggestions } from './SearchSuggestions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // BAGO: Kukunin ang bilang direkta sa hook para laging updated
  const { myList } = useUserPreferences();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");
        setIsAdmin(!!(roles && roles.length > 0));
      } else {
        setIsAdmin(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      // BAGO: Tinanggal ang setMyListCount dito dahil matik na yan sa hook
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const sessionId = `user_${Math.random().toString(36).substring(2, 15)}`;
    const channel = supabase.channel('online-users', { config: { presence: { key: sessionId } } });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineCount(Math.max(1, Object.keys(state).length));
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/tv-shows', label: 'TV Shows', icon: MonitorPlay },
    { path: '/live-tv', label: 'Live TV', icon: Tv },
  ];

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 transition-all duration-700 ease-out ${
      scrolled || !isHome 
        ? 'glass-card-heavy py-3 rounded-[2rem]' 
        : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-500 group-hover:scale-110 group-active:scale-95">
                  <Tv className="w-6 h-6 text-black" fill="currentColor" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white hidden sm:block">
                TV<span className="text-primary italic">STREAMZ</span>
              </span>
            </Link>
            
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 transition-all duration-700 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              </span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{onlineCount.toLocaleString()} LIVE NOW</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 glass-card p-1.5 rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 group overflow-hidden ${
                    isActive 
                      ? 'text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-reveal" />
                  )}
                  <Icon className={`relative z-10 w-4 h-4 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'fill-current' : ''}`} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center transition-all duration-700 ease-in-out ${isSearchOpen ? 'w-64 md:w-80' : 'w-10'}`}>
              {isSearchOpen ? (
                <SearchSuggestions isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchOpen(true)} 
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all duration-500 hover:scale-110 hover:shadow-glow-orange group"
                >
                  <Search className="w-5 h-5 group-hover:text-primary transition-colors" />
                </Button>
              )}
            </div>

            <NotificationBell />
            
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all duration-500 hover:scale-110 group"
                >
                  <Menu className="w-6 h-6 group-hover:text-primary transition-colors" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-black/95 backdrop-blur-3xl border-white/5 p-0 overflow-hidden shadow-2xl">
                <div className="h-full flex flex-col pt-24 px-8">
                  <div className="mb-10">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">IDENTITY</p>
                     {!isLoggedIn ? (
                        <Button asChild className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                          <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                            <Shield className="w-5 h-5" />
                            Secure Access
                          </Link>
                        </Button>
                     ) : (
                        <div className="p-5 rounded-[1.5rem] glass-card flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black text-black shadow-lg">A</div>
                           <div>
                              <p className="font-black text-sm uppercase tracking-wider">Premium Access</p>
                              <p className="text-[10px] text-zinc-500 tracking-widest font-medium">VERIFIED MEMBER</p>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 mt-4">EXPERIENCE</p>
                    
                    <Link to="/my-list" onClick={() => setIsMenuOpen(false)} className="group flex items-center justify-between p-5 rounded-[1.5rem] glass-card hover:bg-white/5 transition-all duration-500 hover:-translate-y-1">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:bg-primary/20">
                          <ListVideo className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-[0.1em]">Your Library</p>
                          <p className="text-[10px] text-zinc-500">{myList.length} Saved Essentials</p>
                        </div>
                      </div>
                    </Link>

                    <Link to="/playlist-player" onClick={() => setIsMenuOpen(false)} className="group flex items-center justify-between p-5 rounded-[1.5rem] glass-card hover:bg-white/5 transition-all duration-500 hover:-translate-y-1">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:bg-secondary/20">
                          <ListMusic className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-[0.1em]">Playlist Engine</p>
                          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">M3U & DRM Core v2</p>
                        </div>
                      </div>
                    </Link>

                    <Link to="/temp-mail" onClick={() => setIsMenuOpen(false)} className="group flex items-center justify-between p-5 rounded-[1.5rem] glass-card hover:bg-white/5 transition-all duration-500 hover:-translate-y-1">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:bg-blue-500/20">
                          <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-[0.1em]">Shadow Inbox</p>
                          <p className="text-[10px] text-zinc-500 font-medium">DISPOSABLE PROTOCOL</p>
                        </div>
                      </div>
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 transition-all duration-500">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                            <Shield className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-black text-xs uppercase tracking-[0.1em] text-destructive">Platform Core</p>
                            <p className="text-[10px] text-destructive-foreground/50 font-medium uppercase tracking-tighter">System Administration</p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  <div className="mt-auto pb-10 text-center">
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.5em]">TVSTREAMZ REDESIGN v3.0</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>

  );
};
