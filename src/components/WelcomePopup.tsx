import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [adClosed, setAdClosed] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    }
  }, []);

  useEffect(() => {
    if (isOpen && countdown > 0 && !adClosed) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !adClosed) {
      setAdClosed(true);
    }
  }, [isOpen, countdown, adClosed]);

  const handleAdClick = () => {
    // Trigger PopAds by opening a new interaction
    // The PopAds script will handle the popup
    window.open('about:blank', '_blank');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-primary/20">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-50 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col sm:flex-row">
          {/* Welcome Message Side */}
          <div className="flex-1 p-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="space-y-4">
              <div className="text-4xl">🎬</div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome to TVStreamz!
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Stream your favorite movies, TV shows, anime, and live TV channels for free. 
                Enjoy unlimited entertainment anytime, anywhere!
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Movies</span>
                <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">TV Shows</span>
                <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Anime</span>
                <span className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">Live TV</span>
              </div>
            </div>
          </div>

          {/* PopAds Side */}
          {!adClosed && (
            <div 
              className="w-full sm:w-48 bg-gradient-to-br from-primary/20 to-primary/30 p-4 flex flex-col items-center justify-center cursor-pointer hover:from-primary/30 hover:to-primary/40 transition-all relative border-l border-primary/10"
              onClick={handleAdClick}
            >
              {/* Countdown Badge */}
              <div className="absolute top-2 right-2 bg-background/90 text-foreground text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                {countdown}s
              </div>

              <div className="text-center space-y-3">
                <div className="text-3xl">🎁</div>
                <p className="text-sm font-medium text-foreground">
                  Support Us!
                </p>
                <p className="text-xs text-muted-foreground">
                  Click here to help keep TVStreamz free
                </p>
                <div className="text-xs text-primary font-medium animate-pulse">
                  Tap to continue →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <Button 
            className="w-full" 
            onClick={handleClose}
          >
            Start Watching 🍿
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
