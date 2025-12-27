import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistItem {
  id: string;
  content_id: number;
  content_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  created_at: string;
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data as WatchlistItem[]);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (item: {
    content_id: number;
    content_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    vote_average: number | null;
    release_date: string | null;
  }) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your watchlist.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          ...item,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already in Watchlist",
            description: `${item.title} is already in your watchlist.`,
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Added to Watchlist",
        description: `${item.title} has been added to your watchlist.`,
      });
      
      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to add to watchlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromWatchlist = async (contentId: number, contentType: 'movie' | 'tv') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Removed from Watchlist",
        description: "Item has been removed from your watchlist.",
      });
      
      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from watchlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const isInWatchlist = (contentId: number, contentType: 'movie' | 'tv') => {
    return watchlist.some(
      (item) => item.content_id === contentId && item.content_type === contentType
    );
  };

  return {
    watchlist,
    isLoading,
    user,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist,
  };
};
