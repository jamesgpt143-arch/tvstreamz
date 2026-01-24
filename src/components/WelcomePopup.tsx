import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface WelcomePopupData {
  enabled: boolean;
  emoji: string;
  title: string;
  message: string;
  button_text: string;
  tags: string[];
}

const defaultData: WelcomePopupData = {
  enabled: true,
  emoji: '🎬',
  title: 'Welcome to TVStreamz!',
  message: 'Stream your favorite movies, TV shows, anime, and live TV channels for free. Enjoy unlimited entertainment anytime, anywhere!',
  button_text: 'Start Watching 🍿',
  tags: ['Movies', 'TV Shows', 'Anime', 'Live TV']
};

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<WelcomePopupData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettingsAndShow = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'welcome_popup')
          .single();

        if (!error && settings?.value) {
          const popupData = settings.value as unknown as WelcomePopupData;
          setData(popupData);
          
          // Only show if enabled and user hasn't seen it this session
          if (popupData.enabled) {
            const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
            if (!hasSeenPopup) {
              setIsOpen(true);
              sessionStorage.setItem('hasSeenWelcomePopup', 'true');
            }
          }
        } else {
          // Fallback to default - show if not seen
          const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
          if (!hasSeenPopup) {
            setIsOpen(true);
            sessionStorage.setItem('hasSeenWelcomePopup', 'true');
          }
        }
      } catch (error) {
        console.error('Error fetching welcome popup settings:', error);
        // Fallback to default
        const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeenPopup) {
          setIsOpen(true);
          sessionStorage.setItem('hasSeenWelcomePopup', 'true');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsAndShow();
  }, []);

  const handleStartWatching = () => {
    // Trigger PopAds by opening a new interaction
    window.open('about:blank', '_blank');
    // Close the popup
    setIsOpen(false);
  };

  const handleClose = () => {
    // Trigger PopAds by opening a new interaction
    window.open('about:blank', '_blank');
    setIsOpen(false);
  };

  if (isLoading || !isOpen) return null;

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
            <div className="text-5xl">{data.emoji}</div>
            <h2 className="text-2xl font-bold text-foreground">
              {data.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {data.message}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {data.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <Button 
            className="w-full" 
            onClick={handleStartWatching}
          >
            {data.button_text}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
