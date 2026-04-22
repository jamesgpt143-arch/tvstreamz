// ComicK API Library - Fallback source for manga
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mangadex-proxy`;

// Helper to call ComicK through our proxy
const proxyFetch = async (endpoint: string): Promise<any> => {
  const url = `${PROXY_URL}?comick=${encodeURIComponent(endpoint)}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  
  if (!response.ok) {
    throw new Error(`ComicK API request failed: ${response.status}`);
  }
  
  return response.json();
};

// Get proxied image URL
export const getComickProxiedImageUrl = (imageUrl: string): string => {
  return `${PROXY_URL}?image=${encodeURIComponent(imageUrl)}`;
};

export interface ComickChapter {
  id: string;
  hid: string;
  title: string | null;
  chap: string | null;
  vol: string | null;
  lang: string;
  created_at: string;
  group_name: string | null;
}

export interface ComickPage {
  url: string;
}

// Search for a manga on ComicK by title
export const searchComickManga = async (title: string): Promise<{ hid: string; slug: string; title: string } | null> => {
  try {
    const data = await proxyFetch(`/v1.0/search?q=${encodeURIComponent(title)}&limit=5`);
    
    if (data && data.length > 0) {
      // Try to find the best match
      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      for (const result of data) {
        const resultTitle = (result.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (resultTitle === normalizedTitle || resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle)) {
          return {
            hid: result.hid,
            slug: result.slug,
            title: result.title,
          };
        }
      }
      
      // Return first result if no good match found
      return {
        hid: data[0].hid,
        slug: data[0].slug,
        title: data[0].title,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching ComicK:', error);
    return null;
  }
};

// Fetch chapters from ComicK
export const fetchComickChapters = async (
  hid: string,
  limit = 100
): Promise<ComickChapter[]> => {
  try {
    const data = await proxyFetch(`/comic/${hid}/chapters?lang=en&limit=${limit}`);
    
    if (data?.chapters && Array.isArray(data.chapters)) {
      return data.chapters.map((ch: any) => ({
        id: ch.hid,
        hid: ch.hid,
        title: ch.title || null,
        chap: ch.chap || null,
        vol: ch.vol || null,
        lang: ch.lang || 'en',
        created_at: ch.created_at,
        group_name: ch.group_name?.[0] || null,
      })).sort((a: ComickChapter, b: ComickChapter) => {
        const aNum = parseFloat(a.chap || '0');
        const bNum = parseFloat(b.chap || '0');
        return aNum - bNum;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching ComicK chapters:', error);
    return [];
  }
};

// Fetch chapter pages from ComicK
export const fetchComickChapterPages = async (chapterHid: string): Promise<string[]> => {
  try {
    const data = await proxyFetch(`/chapter/${chapterHid}`);
    
    if (data?.chapter?.images && Array.isArray(data.chapter.images)) {
      return data.chapter.images.map((img: any) => {
        // ComicK image URLs are usually like: https://meo3.comick.pictures/...
        const url = img.url || img.src || '';
        return getComickProxiedImageUrl(url);
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching ComicK chapter pages:', error);
    return [];
  }
};
