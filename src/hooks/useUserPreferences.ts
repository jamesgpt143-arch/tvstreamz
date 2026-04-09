import { useState, useEffect } from 'react';

// Ito ang format ng data na hinihingi ng MyList page mo
export interface MyListItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average?: number | string;
}

export function useUserPreferences() {
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kinukuha ang data sa local storage (para hindi mawala ang luma mong naka-save)
    const loadList = () => {
      try {
        const saved = localStorage.getItem('tvstreamz_my_list'); // Siguraduhing ito ang ginamit mong key dati
        if (saved) {
          setMyList(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load my list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Mabilis na delay para mag-trigger ang loading animation
    setTimeout(loadList, 300);

    // Makikinig din ito kung may binago sa ibang page
    const handleUpdate = () => loadList();
    window.addEventListener('myListUpdated', handleUpdate);
    return () => window.removeEventListener('myListUpdated', handleUpdate);
  }, []);

  const removeFromMyList = (id: number, type: 'movie' | 'tv') => {
    setMyList((prev) => {
      const newList = prev.filter((item) => !(item.id === id && item.type === type));
      localStorage.setItem('tvstreamz_my_list', JSON.stringify(newList));
      window.dispatchEvent(new Event('myListUpdated')); // I-notify ang app na may tinanggal
      return newList;
    });
  };

  const clearMyList = () => {
    setMyList([]);
    localStorage.removeItem('tvstreamz_my_list');
    window.dispatchEvent(new Event('myListUpdated'));
  };

  const addToMyList = (item: MyListItem) => {
    setMyList((prev) => {
      const exists = prev.some((i) => i.id === item.id && i.type === item.type);
      if (exists) return prev;
      const newList = [item, ...prev];
      localStorage.setItem('tvstreamz_my_list', JSON.stringify(newList));
      window.dispatchEvent(new Event('myListUpdated'));
      return newList;
    });
  };

  return { myList, removeFromMyList, clearMyList, addToMyList, isLoading };
}
