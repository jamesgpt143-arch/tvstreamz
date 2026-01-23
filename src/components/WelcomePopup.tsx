import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    }
  }, []);

  const handleStartWatching = () => {
    // Trigger PopAds by opening a new interaction
    window.open('about:blank', '_blank');
    // Close the popup
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-primary/20">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-50 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Welcome Content */}
        <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="space-y-4 text-center">
            <div className="text-5xl">🎬</div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to TVStreamz!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Stream your favorite movies, TV shows, anime, and live TV channels for free. 
              Enjoy unlimited entertainment anytime, anywhere!
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Movies</span>
              <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">TV Shows</span>
              <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Anime</span>
              <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Live TV</span>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <Button 
            className="w-full" 
            onClick={handleStartWatching}
          >
            Start Watching 🍿
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
