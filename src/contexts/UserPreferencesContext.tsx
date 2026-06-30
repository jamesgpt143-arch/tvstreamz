import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setMyList(getLocalList());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMyList(getLocalList());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToMyList = useCallback(async (item: MyListItem) => {
    const exists = myList.some((i) => {
      const isSameId = String(i.id).toLowerCase() === String(item.id).toLowerCase();
      return isSameId && i.type === item.type;
    });
    if (exists) return false;

    const newList = [item, ...myList];
    setMyList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return true;
  }, [myList]);

  const removeFromMyList = useCallback(async (id: number | string, type: 'movie' | 'tv' | 'channel') => {
    const newList = myList.filter((item) => {
      const isSameId = String(item.id).toLowerCase() === String(id).toLowerCase();
      return !(isSameId && item.type === type);
    });
    setMyList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  }, [myList]);

  const clearMyList = useCallback(async () => {
    setMyList([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isInMyList = useCallback((id: number | string, type: 'movie' | 'tv' | 'channel') => {
    return myList.some((item) => {
      const isSameId = String(item.id).toLowerCase() === String(id).toLowerCase();
      return isSameId && item.type === type;
    });
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
