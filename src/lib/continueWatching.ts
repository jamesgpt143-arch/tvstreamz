export interface ContinueWatchingItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  progress: number; // 0-100 percentage
  currentTime: number; // in seconds
  duration: number; // in seconds
  season?: number;
  episode?: number;
  updatedAt: number;
}

const STORAGE_KEY = 'continue_watching';
const MAX_ITEMS = 20;

export const getContinueWatching = (): ContinueWatchingItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const updateWatchProgress = (item: Omit<ContinueWatchingItem, 'updatedAt'>) => {
  const list = getContinueWatching();
  
  // Remove if already exists
  const filtered = list.filter(i => !(i.id === item.id && i.type === item.type));
  
  // Only save if not completed (less than 95%)
  if (item.progress < 95) {
    const updated = [
      { ...item, updatedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } else {
    // Remove from continue watching if completed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};

export const removeFromContinueWatching = (id: number, type: 'movie' | 'tv') => {
  const list = getContinueWatching();
  const updated = list.filter(item => !(item.id === id && item.type === type));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getWatchProgress = (id: number, type: 'movie' | 'tv'): ContinueWatchingItem | null => {
  const list = getContinueWatching();
  return list.find(item => item.id === id && item.type === type) || null;
};
