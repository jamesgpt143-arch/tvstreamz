import { useState, useEffect, useCallback } from 'react';

export interface MyListItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average?: number | string;
}

const STORAGE_KEY = 'tvstreamz_my_list';

// Helper function para laging fresh ang pagkuha
const getStoredList = (): MyListItem[] => {
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

  // Initial load at event listener setup
  useEffect(() => {
    setMyList(getStoredList());
    setIsLoading(false);

    const handleStorageChange = () => {
      setMyList(getStoredList());
    };

    // Makikinig tayo kapag nag-dispatch tayo ng custom event
    window.addEventListener('myListUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('myListUpdated', handleStorageChange);
    };
  }, []);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event('myListUpdated'));
  };

  const addToMyList = useCallback((item: MyListItem) => {
    const currentList = getStoredList();
    const exists = currentList.some((i) => i.id === item.id && i.type === item.type);
    
    if (!exists) {
      const newList = [item, ...currentList];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setMyList(newList);
      triggerUpdate();
      return true; // Return true kung success
    }
    return false;
  }, []);

  const removeFromMyList = useCallback((id: number, type: 'movie' | 'tv') => {
    const currentList = getStoredList();
    const newList = currentList.filter((item) => !(item.id === id && item.type === type));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    setMyList(newList);
    triggerUpdate();
  }, []);

  const clearMyList = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMyList([]);
    triggerUpdate();
  }, []);

  const isInMyList = useCallback((id: number, type: 'movie' | 'tv') => {
    return myList.some((item) => item.id === id && item.type === item.type);
  }, [myList]);

  return { 
    myList, 
    addToMyList, 
    removeFromMyList, 
    clearMyList, 
    isInMyList, // Idinagdag natin ito para madaling mag-check kung naka-add na
    isLoading 
  };
}
