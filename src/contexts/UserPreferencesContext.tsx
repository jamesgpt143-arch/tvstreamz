import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MyListItem {
  id: number | string;
  type: 'movie' | 'tv' | 'channel';
  title: string;
  poster_path: string | null;
  vote_average?: number | string;
}

interface UserPreferencesContextType {
  myList: MyListItem[];
  addToMyList: (item: MyListItem) => Promise<boolean>;
  removeFromMyList: (id: number | string, type: 'movie' | 'tv' | 'channel') => Promise<void>;
  clearMyList: () => Promise<void>;
  isInMyList: (id: number | string, type: 'movie' | 'tv' | 'channel') => boolean;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'tvstreamz_my_list';

const getLocalList = (): MyListItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth status
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
            type: item.content_type as 'movie' | 'tv' | 'channel',
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

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Handle cross-tab updates for Guest mode
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && !userId) {
        setMyList(getLocalList());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  const addToMyList = useCallback(async (item: MyListItem) => {
    const exists = myList.some((i) => String(i.id) === String(item.id) && i.type === item.type);
    if (exists) return false;

    // Optimistic UI update
    const newList = [item, ...myList];
    setMyList(newList);

    if (userId) {
      try {
        const { error } = await supabase.from('user_my_list').insert({
          user_id: userId,
          content_id: String(item.id),
          content_type: item.type,
          title: item.title,
          poster_path: item.poster_path,
          vote_average: item.vote_average ? Number(item.vote_average) : null
        });
        if (error) throw error;
      } catch (error) {
        console.error('Error saving to online list:', error);
        fetchList(); // Revert
        return false;
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    }
    return true;
  }, [myList, userId, fetchList]);

  const removeFromMyList = useCallback(async (id: number | string, type: 'movie' | 'tv' | 'channel') => {
    const newList = myList.filter((item) => !(String(item.id) === String(id) && item.type === type));
    setMyList(newList);

    if (userId) {
      try {
        const { error } = await supabase
          .from('user_my_list')
          .delete()
          .match({ user_id: userId, content_id: String(id), content_type: type });
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting from online list:', error);
        fetchList();
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    }
  }, [myList, userId, fetchList]);

  const clearMyList = useCallback(async () => {
    setMyList([]);
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_my_list')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      } catch (error) {
        console.error('Error clearing online list:', error);
        fetchList();
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [userId, fetchList]);

  const isInMyList = useCallback((id: number | string, type: 'movie' | 'tv' | 'channel') => {
    return myList.some((item) => String(item.id) === String(id) && item.type === type);
  }, [myList]);

  return (
    <UserPreferencesContext.Provider value={{
      myList,
      addToMyList,
      removeFromMyList,
      clearMyList,
      isInMyList,
      isLoading
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferencesContext = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferencesContext must be used within a UserPreferencesProvider');
  }
  return context;
};
