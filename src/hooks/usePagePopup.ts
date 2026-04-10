import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;
  
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
  
  return !error && data === true;
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
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'page_popups')
        .maybeSingle();

      if (!error && data?.value) {
        const popups = data.value as unknown as PagePopups;
        if (popups[pageId]) {
          setConfig(popups[pageId]);
        }
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
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'page_popups')
        .maybeSingle();

      if (!error && data?.value) {
        setPopups(data.value as unknown as PagePopups);
      } else {
        // Initialize with defaults
        const defaults: PagePopups = {};
        availablePages.forEach(page => {
          defaults[page.id] = { enabled: false, url: '' };
        });
        setPopups(defaults);
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
      // Check if record exists
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'page_popups')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: popups as unknown as Json, updated_at: new Date().toISOString() })
          .eq('key', 'page_popups');
      } else {
        await supabase
          .from('site_settings')
          .insert([{ key: 'page_popups', value: popups as unknown as Json }]);
      }

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
