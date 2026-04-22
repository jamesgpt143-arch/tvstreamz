import { useState, useEffect } from 'react';
import { searchMulti, Movie } from '@/lib/tmdb';
import { useChannels, DbChannel, toAppChannel } from '@/hooks/useChannels';

export interface UnifiedResult {
  id: string | number;
  title: string;
  type: 'live' | 'movie' | 'tv';
  poster_path: string | null;
  data: any;
}

export const useUnifiedSearch = (query: string) => {
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: channels } = useChannels();

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Search Channels from Supabase
        const channelResults: UnifiedResult[] = (channels || [])
          .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
          .map(c => ({
            id: c.id,
            title: c.name,
            type: 'live',
            poster_path: c.logo_url,
            data: toAppChannel(c)
          }));

        // 2. Search Movies/TV from TMDB
        const tmdbData = await searchMulti(query);
        const tmdbResults: UnifiedResult[] = tmdbData.map(item => ({
          id: item.id,
          title: item.title || item.name || '',
          type: item.media_type as 'movie' | 'tv',
          poster_path: item.poster_path,
          data: item
        }));

        setResults([...channelResults, ...tmdbResults]);
      } catch (error) {
        console.error('Unified search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, channels]);

  return { results, isLoading };
};
