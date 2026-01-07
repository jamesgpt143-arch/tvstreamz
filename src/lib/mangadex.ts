// MangaDex API Library
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mangadex-proxy`;

// Helper to call MangaDex through our proxy
const proxyFetch = async (endpoint: string): Promise<any> => {
  const url = `${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

export interface Manga {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: string[];
  coverUrl: string | null;
  author: string | null;
  artist: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  chapter: string | null;
  volume: string | null;
  pages: number;
  publishAt: string;
  scanlationGroup: string | null;
  language: string;
}

export interface ChapterPages {
  baseUrl: string;
  hash: string;
  data: string[];
  dataSaver: string[];
}

// Helper to extract English or first available title
const getTitle = (attributes: any): string => {
  if (attributes.title?.en) return attributes.title.en;
  if (attributes.title?.['ja-ro']) return attributes.title['ja-ro'];
  const firstKey = Object.keys(attributes.title || {})[0];
  return firstKey ? attributes.title[firstKey] : 'Unknown Title';
};

// Helper to get description
const getDescription = (attributes: any): string => {
  if (attributes.description?.en) return attributes.description.en;
  const firstKey = Object.keys(attributes.description || {})[0];
  return firstKey ? attributes.description[firstKey] : '';
};

// Helper to get cover URL
const getCoverUrl = (manga: any): string | null => {
  const coverRel = manga.relationships?.find((r: any) => r.type === 'cover_art');
  if (coverRel?.attributes?.fileName) {
    return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
  }
  return null;
};

// Helper to get author/artist
const getCreator = (manga: any, type: 'author' | 'artist'): string | null => {
  const rel = manga.relationships?.find((r: any) => r.type === type);
  return rel?.attributes?.name || null;
};

// Transform raw manga data to our interface
const transformManga = (manga: any): Manga => ({
  id: manga.id,
  title: getTitle(manga.attributes),
  altTitles: manga.attributes.altTitles?.map((t: any) => Object.values(t)[0] as string) || [],
  description: getDescription(manga.attributes),
  status: manga.attributes.status || 'unknown',
  year: manga.attributes.year,
  contentRating: manga.attributes.contentRating || 'safe',
  tags: manga.attributes.tags?.map((t: any) => t.attributes?.name?.en || '').filter(Boolean) || [],
  coverUrl: getCoverUrl(manga),
  author: getCreator(manga, 'author'),
  artist: getCreator(manga, 'artist'),
});

// Transform chapter data
const transformChapter = (chapter: any): Chapter => {
  const scanlationGroup = chapter.relationships?.find((r: any) => r.type === 'scanlation_group');
  return {
    id: chapter.id,
    title: chapter.attributes.title || '',
    chapter: chapter.attributes.chapter,
    volume: chapter.attributes.volume,
    pages: chapter.attributes.pages || 0,
    publishAt: chapter.attributes.publishAt,
    scanlationGroup: scanlationGroup?.attributes?.name || null,
    language: chapter.attributes.translatedLanguage || 'en',
  };
};

// Fetch popular manga
export const fetchPopularManga = async (limit = 20, offset = 0): Promise<Manga[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      'includes[]': 'cover_art',
      'order[followedCount]': 'desc',
      'contentRating[]': 'safe',
      'availableTranslatedLanguage[]': 'en',
    });

    const data = await proxyFetch(`/manga?${params}`);
    return data.data?.map(transformManga) || [];
  } catch (error) {
    console.error('Error fetching popular manga:', error);
    return [];
  }
};

// Fetch latest updated manga
export const fetchLatestManga = async (limit = 20, offset = 0): Promise<Manga[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      'includes[]': 'cover_art',
      'order[latestUploadedChapter]': 'desc',
      'contentRating[]': 'safe',
      'availableTranslatedLanguage[]': 'en',
    });

    const data = await proxyFetch(`/manga?${params}`);
    return data.data?.map(transformManga) || [];
  } catch (error) {
    console.error('Error fetching latest manga:', error);
    return [];
  }
};

// Search manga
export const searchManga = async (query: string, limit = 20, offset = 0): Promise<Manga[]> => {
  try {
    const params = new URLSearchParams({
      title: query,
      limit: limit.toString(),
      offset: offset.toString(),
      'includes[]': 'cover_art',
      'contentRating[]': 'safe',
      'availableTranslatedLanguage[]': 'en',
    });

    const data = await proxyFetch(`/manga?${params}`);
    return data.data?.map(transformManga) || [];
  } catch (error) {
    console.error('Error searching manga:', error);
    return [];
  }
};

// Fetch manga details
export const fetchMangaDetails = async (mangaId: string): Promise<Manga | null> => {
  try {
    const params = new URLSearchParams({
      'includes[]': 'cover_art',
    });
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');

    const data = await proxyFetch(`/manga/${mangaId}?${params}`);
    return data.data ? transformManga(data.data) : null;
  } catch (error) {
    console.error('Error fetching manga details:', error);
    return null;
  }
};

// Fetch chapters for a manga
export const fetchMangaChapters = async (
  mangaId: string,
  limit = 100,
  offset = 0
): Promise<Chapter[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      'translatedLanguage[]': 'en',
      'includes[]': 'scanlation_group',
      'order[chapter]': 'asc',
      'contentRating[]': 'safe',
    });

    const data = await proxyFetch(`/manga/${mangaId}/feed?${params}`);
    return data.data?.map(transformChapter) || [];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
};

// Fetch chapter pages
export const fetchChapterPages = async (chapterId: string): Promise<ChapterPages | null> => {
  try {
    const data = await proxyFetch(`/at-home/server/${chapterId}`);
    
    if (data.baseUrl && data.chapter) {
      return {
        baseUrl: data.baseUrl,
        hash: data.chapter.hash,
        data: data.chapter.data,
        dataSaver: data.chapter.dataSaver,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching chapter pages:', error);
    return null;
  }
};

// Get full image URL for a chapter page
export const getChapterPageUrl = (
  baseUrl: string,
  hash: string,
  filename: string,
  quality: 'data' | 'data-saver' = 'data'
): string => {
  return `${baseUrl}/${quality}/${hash}/${filename}`;
};

// Fetch manga by tag/genre
export const fetchMangaByTag = async (
  tagId: string,
  limit = 20,
  offset = 0
): Promise<Manga[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      'includes[]': 'cover_art',
      'includedTags[]': tagId,
      'contentRating[]': 'safe',
      'availableTranslatedLanguage[]': 'en',
      'order[followedCount]': 'desc',
    });

    const data = await proxyFetch(`/manga?${params}`);
    return data.data?.map(transformManga) || [];
  } catch (error) {
    console.error('Error fetching manga by tag:', error);
    return [];
  }
};

// Fetch available tags
export const fetchTags = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const data = await proxyFetch(`/manga/tag`);
    return data.data?.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes?.name?.en || 'Unknown',
    })) || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Common genre tag IDs
export const MANGA_GENRES = [
  { id: 'a3c67850-4684-404e-9b7f-c69850ee5da6', name: 'Action' },
  { id: '4d32cc48-9f00-4cca-9b5a-a839f0764984', name: 'Comedy' },
  { id: 'b9af3a63-f058-46de-a9a0-e0c13906197a', name: 'Drama' },
  { id: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc', name: 'Fantasy' },
  { id: '423e2eae-a7a2-4a8b-ac03-a8351462d71d', name: 'Romance' },
  { id: 'f8f62932-27da-4fe4-8ee1-6779a8c5edba', name: 'Slice of Life' },
  { id: 'cdad7e68-1419-41dd-bdce-27753074a640', name: 'Horror' },
  { id: 'ee968100-4191-4968-93d3-f82d72be7e46', name: 'Mystery' },
  { id: 'caaa44eb-cd40-4177-b930-79d3ef2afe87', name: 'School Life' },
  { id: '256c8bd9-4904-4360-bf4f-508a76d67183', name: 'Sci-Fi' },
];
