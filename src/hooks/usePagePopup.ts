import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// BAGO: I-import ang Capacitor Browser Plugin
import { Browser } from '@capacitor/browser';

interface PagePopupConfig {
  enabled: boolean;
  url: string;
}

interface PagePopups {
  [pageId: string]: PagePopupConfig;
}

const DEFAULT_CONFIG: PagePopupConfig = {
  enabled: false,
  url: '',
};

// Helper function to check if user is admin
async function isUserAdmin(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth');
    if (res.ok) {
      const data = await res.json();
      return data.isAdmin;
    }
  } catch (e) {
    // Ignore error
  }
  return false;
}

export function usePagePopup(pageId: string) {
  const [config, setConfig] = useState<PagePopupConfig>(DEFAULT_CONFIG);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchConfigAndCheckAdmin = async () => {
      // Check if user is admin
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
      
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.page_popups && data.page_popups[pageId]) {
            setConfig(data.page_popups[pageId]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch popups', e);
      }
    };

    fetchConfigAndCheckAdmin();
  }, [pageId]);

  // Trigger popup when config is loaded and enabled (skip for admins)
  useEffect(() => {
    if (isAdmin) return; // Don't show popup to admins
    
    if (config.enabled && config.url && !hasTriggered) {
      setHasTriggered(true);
      
      // BAGO: Function para i-handle ang pagbukas gamit ang Capacitor kung nasa mobile
      const openLink = async () => {
        try {
          // Subukang buksan gamit ang Capacitor Browser (safe para sa Android/Shopee)
          await Browser.open({ url: config.url });
        } catch (error) {
          console.warn("Capacitor Browser failed, falling back to window.open", error);
          // Fallback para sa Web / PWA
          const popup = window.open(config.url, '_blank');
          
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            toast('🎁 May special offer para sayo!', {
              description: 'I-click para buksan',
              action: {
                label: 'Buksan',
                onClick: () => window.open(config.url, '_blank'),
              },
              duration: 8000,
            });
          }
        }
      };

      // I-trigger agad
      openLink();
    }
  }, [config, hasTriggered, isAdmin]);

  return { config, hasTriggered, isAdmin };
}

// Admin hook for managing all page popups
export function usePagePopupsAdmin() {
  const [popups, setPopups] = useState<PagePopups>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const availablePages = [
    { id: 'anime', label: 'Anime' },
    { id: 'livetv', label: 'Live TV' },
    { id: 'movies', label: 'Movies' },
    { id: 'tvshows', label: 'TV Shows' },
    { id: 'home', label: 'Home' },
  ];

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.page_popups) {
          setPopups(data.page_popups);
        } else {
          // Initialize with defaults
          const defaults: PagePopups = {};
          availablePages.forEach(page => {
            defaults[page.id] = { enabled: false, url: '' };
          });
          setPopups(defaults);
        }
      }
    } catch (error) {
      console.error('Error fetching page popups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePopup = (pageId: string, updates: Partial<PagePopupConfig>) => {
    setPopups(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId] || DEFAULT_CONFIG,
        ...updates,
      },
    }));
  };

  const savePopups = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'page_popups', value: popups })
      });
      if (!res.ok) throw new Error('Failed to save');
      return { success: true };
    } catch (error) {
      console.error('Error saving page popups:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    popups,
    availablePages,
    isLoading,
    isSaving,
    updatePopup,
    savePopups,
    refetch: fetchPopups,
  };
}
