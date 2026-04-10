import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MyListItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average?: number | string;
}

const STORAGE_KEY = 'tvstreamz_my_list';

// Helper for local storage (Guests)
const getLocalList = (): MyListItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function useUserPreferences() {
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initial check kung naka-login ang user
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch list (Mula Supabase kung logged in, o LocalStorage kung hindi)
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_my_list')
          .select('*')
          .order('added_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          const formattedList: MyListItem[] = data.map(item => ({
            id: item.content_id,
            type: item.content_type as 'movie' | 'tv',
            title: item.title,
            poster_path: item.poster_path,
            vote_average: item.vote_average
          }));
          setMyList(formattedList);
        }
      } catch (error) {
        console.error('Error fetching online list:', error);
      }
    } else {
      setMyList(getLocalList());
    }
    setIsLoading(false);
  }, [userId]);

  // Awtomatikong mag-fetch kapag nagbago ang login status
  useEffect(() => {
    fetchList();

    const handleStorageChange = () => {
      if (!userId) setMyList(getLocalList());
    };

    window.addEventListener('myListUpdated', handleStorageChange);
    return () => window.removeEventListener('myListUpdated', handleStorageChange);
  }, [fetchList, userId]);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event('myListUpdated'));
  };

  const addToMyList = useCallback(async (item: MyListItem) => {
    const exists = myList.some((i) => i.id === item.id && i.type === item.type);
    if (exists) return false;

    // Optimistic UI update
    const newList = [item, ...myList];
    setMyList(newList);

    if (userId) {
      try {
        await supabase.from('user_my_list').insert({
          user_id: userId,
          content_id: item.id,
          content_type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          vote_average: item.vote_average ? Number(item.vote_average) : null
        });
      } catch (error) {
        console.error('Error saving to online list:', error);
        // Revert kung nag-fail
        fetchList();
        return false;
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      triggerUpdate();
    }
    return true;
  }, [myList, userId, fetchList]);

  const removeFromMyList = useCallback(async (id: number, type: 'movie' | 'tv') => {
    // Optimistic update
    const newList = myList.filter((item) => !(item.id === id && item.type === type));
    setMyList(newList);

    if (userId) {
      try {
        await supabase
          .from('user_my_list')
          .delete()
          .match({ user_id: userId, content_id: id, content_type: type });
      } catch (error) {
        console.error('Error deleting from online list:', error);
        fetchList(); // Revert kung fail
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      triggerUpdate();
    }
  }, [myList, userId, fetchList]);

  const clearMyList = useCallback(async () => {
    setMyList([]);
    if (userId) {
      try {
        await supabase
          .from('user_my_list')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error clearing online list:', error);
        fetchList();
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      triggerUpdate();
    }
  }, [userId, fetchList]);

  const isInMyList = useCallback((id: number, type: 'movie' | 'tv') => {
    return myList.some((item) => item.id === id && item.type === item.type);
  }, [myList]);

  return { 
    myList, 
    addToMyList, 
    removeFromMyList, 
    clearMyList, 
    isInMyList, 
    isLoading 
  };
}
