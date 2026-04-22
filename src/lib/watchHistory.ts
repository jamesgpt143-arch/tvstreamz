export interface WatchedItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  watchedAt: number;
  genre_ids?: number[];
}

const STORAGE_KEY = 'watch_history';
const MAX_ITEMS = 20;

export const getWatchHistory = (): WatchedItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToWatchHistory = (item: Omit<WatchedItem, 'watchedAt'>) => {
  const history = getWatchHistory();
  
  // Remove if already exists
  const filtered = history.filter(h => !(h.id === item.id && h.type === item.type));
  
  // Add to beginning
  const updated = [
    { ...item, watchedAt: Date.now() },
    ...filtered
  ].slice(0, MAX_ITEMS);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getLastWatched = (): WatchedItem | null => {
  const history = getWatchHistory();
  return history.length > 0 ? history[0] : null;
};

export const getRecentGenres = (): number[] => {
  const history = getWatchHistory();
  const genres = history.flatMap(item => item.genre_ids || []);
  // Count occurrences and get top genres
  const genreCounts = genres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => Number(id));
};
