export interface MyListItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average?: number;
  release_date?: string;
  addedAt: number;
}

const STORAGE_KEY = 'my_list';

export const getMyList = (): MyListItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToMyList = (item: Omit<MyListItem, 'addedAt'>) => {
  const list = getMyList();
  
  // Check if already exists
  if (list.some(i => i.id === item.id && i.type === item.type)) {
    return false;
  }
  
  const updated = [
    { ...item, addedAt: Date.now() },
    ...list
  ];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return true;
};

export const removeFromMyList = (id: number, type: 'movie' | 'tv') => {
  const list = getMyList();
  const updated = list.filter(item => !(item.id === id && item.type === type));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const isInMyList = (id: number, type: 'movie' | 'tv'): boolean => {
  const list = getMyList();
  return list.some(item => item.id === id && item.type === type);
};
