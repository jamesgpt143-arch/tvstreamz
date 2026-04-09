import { supabase } from "@/integrations/supabase/client";

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

export const getMyList = async (): Promise<MyListItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching watchlist:", error);
      return [];
    }

    return data.map(item => ({
      id: item.content_id,
      type: item.content_type as 'movie' | 'tv',
      title: item.title,
      poster_path: item.poster_path,
      vote_average: item.vote_average || undefined,
      release_date: item.release_date || undefined,
      addedAt: new Date(item.created_at).getTime()
    }));
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToMyList = async (item: Omit<MyListItem, 'addedAt'>) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from('watchlist')
      .upsert({
        user_id: user.id,
        content_id: item.id,
        content_type: item.type,
        title: item.title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date
      }, { onConflict: 'user_id,content_id,content_type' });

    if (error) {
      console.error("Error adding to watchlist:", error);
      return false;
    }
    return true;
  }

  const list = await getMyList();
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

export const removeFromMyList = async (id: number, type: 'movie' | 'tv') => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', id)
      .eq('content_type', type);

    if (error) {
      console.error("Error removing from watchlist:", error);
    }
    return;
  }

  const list = await getMyList();
  const updated = list.filter(item => !(item.id === id && item.type === type));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const isInMyList = async (id: number, type: 'movie' | 'tv'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', id)
      .eq('content_type', type)
      .maybeSingle();
    
    return !!data && !error;
  }

  const list = await getMyList();
  return list.some(item => item.id === id && item.type === type);
};

export const clearMyList = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id);
    
    if (error) console.error("Error clearing watchlist:", error);
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
};
