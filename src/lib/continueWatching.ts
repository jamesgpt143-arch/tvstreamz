export interface WatchProgress {
  id: string | number;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  progress: number;
  currentTime: number;
  duration: number;
  season?: number;
  episode?: number;
  lastServer?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'tvstreamz_continue_watching';

// --- LOCAL FUNCTIONS (Ito yung ginagamit ng Watch.tsx at ibang pages) ---

export const getContinueWatching = (): WatchProgress[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const getWatchProgress = (id: number | string, type: 'movie' | 'tv' | 'anime'): WatchProgress | null => {
  const history = getContinueWatching();
  return history.find((item) => String(item.id) === String(id) && item.type === type) || null;
};

export const updateWatchProgress = (progress: Omit<WatchProgress, 'updatedAt'>) => {
  const history = getContinueWatching();
  const index = history.findIndex((item) => String(item.id) === String(progress.id) && item.type === progress.type);
  
  const updatedProgress = { ...progress, updatedAt: Date.now() };

  if (index >= 0) {
    history[index] = updatedProgress;
  } else {
    history.unshift(updatedProgress);
  }

  // Panatilihing hanggang 50 items lang para hindi bumigat
  const trimmedHistory = history.slice(0, 50);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  window.dispatchEvent(new Event('continueWatchingUpdated'));
};

export const removeFromContinueWatching = (id: number | string, type: 'movie' | 'tv' | 'anime') => {
  const history = getContinueWatching();
  const newHistory = history.filter((item) => !(String(item.id) === String(id) && item.type === type));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  window.dispatchEvent(new Event('continueWatchingUpdated'));
};
