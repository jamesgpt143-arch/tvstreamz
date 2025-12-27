import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, X, Tv, Film, MonitorPlay, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/tv-shows', label: 'TV Shows', icon: MonitorPlay },
    { path: '/anime', label: 'Anime', icon: Sparkles },
    { path: '/live-tv', label: 'Live TV', icon: Tv },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">PinoyFlix</span>
          </Link>

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

          {/* Search, Theme Toggle & Mobile Menu */}
          <div className="flex items-center gap-1">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                <Input
                  type="text"
                  placeholder="Search movies, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 bg-secondary border-border"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </form>
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
