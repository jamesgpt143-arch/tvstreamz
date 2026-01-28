import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

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

export function usePagePopup(pageId: string) {
  const [config, setConfig] = useState<PagePopupConfig>(DEFAULT_CONFIG);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
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

    fetchConfig();
  }, [pageId]);

  // Trigger popup when config is loaded and enabled
  useEffect(() => {
    if (config.enabled && config.url && !hasTriggered) {
      setHasTriggered(true);
      
      // Try to open popup directly first
      const popup = window.open(config.url, '_blank');
      
      // If blocked by browser, show a toast with clickable link
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
  }, [config, hasTriggered]);

  return { config, hasTriggered };
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
