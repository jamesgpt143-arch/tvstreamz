import { supabase } from '@/integrations/supabase/client';

export interface WatchProgress {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  progress: number;
  currentTime: number;
  duration: number;
  season?: number;
  episode?: number;
  lastServer?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'tvstreamz_continue_watching';

// Kuhanin ang current user ID (Awtomatiko sa background)
let currentUserId: string | null = null;
supabase.auth.getSession().then(({ data }) => {
  currentUserId = data.session?.user?.id || null;
  if (currentUserId) syncFromCloud(); // I-download ang history pagkakuha ng session
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUserId = session?.user?.id || null;
  if (currentUserId) syncFromCloud();
});

// --- CLOUD SYNCING FUNCTIONS ---

// I-download mula sa Supabase at i-save sa LocalStorage
const syncFromCloud = async () => {
  if (!currentUserId) return;
  try {
    const { data, error } = await supabase
      .from('user_watch_history')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (data) {
      const cloudHistory: WatchProgress[] = data.map((item) => ({
        id: item.content_id,
        type: item.content_type as 'movie' | 'tv',
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        progress: Number(item.progress),
        currentTime: Number(item.current_time),
        duration: Number(item.duration),
        season: item.season,
        episode: item.episode,
        lastServer: item.last_server,
        updatedAt: new Date(item.updated_at).getTime(),
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudHistory));
      window.dispatchEvent(new Event('continueWatchingUpdated'));
    }
  } catch (error) {
    console.error('Error syncing history from cloud:', error);
  }
};

// I-upload sa Supabase (May "Delay" para hindi mapuno ang database habang nanonood)
let syncTimeout: any;
const syncToCloud = (progress: WatchProgress) => {
  if (!currentUserId) return;

  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const payload = {
        user_id: currentUserId,
        content_id: progress.id,
        content_type: progress.type,
        title: progress.title,
        poster_path: progress.poster_path,
        backdrop_path: progress.backdrop_path,
        progress: progress.progress,
        current_time: progress.currentTime,
        duration: progress.duration,
        season: progress.season,
        episode: progress.episode,
        last_server: progress.lastServer,
        updated_at: new Date(progress.updatedAt).toISOString()
      };

      // Gumamit ng UPSERT (Insert or Update kung mayroon na)
      const { error } = await supabase
        .from('user_watch_history')
        .upsert(payload, { onConflict: 'user_id, content_id, content_type' });

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing history to cloud:', error);
    }
  }, 2500); // 2.5 seconds delay bago mag-save sa DB
};

const deleteFromCloud = async (id: number, type: 'movie' | 'tv') => {
  if (!currentUserId) return;
  try {
    await supabase
      .from('user_watch_history')
      .delete()
      .match({ user_id: currentUserId, content_id: id, content_type: type });
  } catch (error) {
    console.error('Error deleting history from cloud:', error);
  }
};

// --- LOCAL FUNCTIONS (Ito yung ginagamit ng Watch.tsx at ibang pages) ---

export const getContinueWatching = (): WatchProgress[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const getWatchProgress = (id: number, type: 'movie' | 'tv'): WatchProgress | null => {
  const history = getContinueWatching();
  return history.find((item) => item.id === id && item.type === type) || null;
};

export const updateWatchProgress = (progress: Omit<WatchProgress, 'updatedAt'>) => {
  const history = getContinueWatching();
  const index = history.findIndex((item) => item.id === progress.id && item.type === progress.type);
  
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

  // BAGO: I-sync online!
  syncToCloud(updatedProgress);
};

export const removeFromContinueWatching = (id: number, type: 'movie' | 'tv') => {
  const history = getContinueWatching();
  const newHistory = history.filter((item) => !(item.id === id && item.type === type));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  window.dispatchEvent(new Event('continueWatchingUpdated'));

  // BAGO: I-delete din online!
  deleteFromCloud(id, type);
};
