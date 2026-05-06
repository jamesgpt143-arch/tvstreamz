const BASE_URL = 'https://api.jikan.moe/v4';

export interface AnimeItem {
  mal_id: number;
  _id: string; // Mapping for compatibility
  title: string;
  image: string;
  images: {
    webp: {
      image_url: string;
      large_image_url: string;
    }
  };
  synopsis: string;
  type: string;
  status: string;
  score: number;
  genres: { name: string }[];
  rank: number;
  episodes: number;
}

export interface AnimeResponse {
  data: AnimeItem[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
  };
}

const fetchFromJikan = async (endpoint: string, params: Record<string, string | number> = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key].toString());
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a second.");
    }
    throw new Error(`Jikan API Error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchAnimeList = async (page = 1, size = 25, search = '', genres = '', sortBy = 'rank', sortOrder = 'asc'): Promise<AnimeResponse> => {
  // Jikan's search endpoint: /anime
  const params: Record<string, string | number> = { 
    page, 
    limit: size,
    order_by: sortBy === 'ranking' ? 'rank' : sortBy,
    sort: sortOrder 
  };
  
  if (search) params.q = search;
  if (genres && genres !== 'all') params.genres = genres;
  
  const result = await fetchFromJikan('/anime', params);
  
  // Map Jikan data to our app's internal format for compatibility
  return {
    data: result.data.map((item: any) => ({
      ...item,
      _id: item.mal_id.toString(),
      image: item.images.webp.large_image_url || item.images.webp.image_url,
    })),
    pagination: result.pagination
  };
};

export const getAnimeById = async (id: string): Promise<any> => {
  const result = await fetchFromJikan(`/anime/${id}`);
  const item = result.data;
  return {
    ...item,
    _id: item.mal_id.toString(),
    image: item.images.webp.large_image_url || item.images.webp.image_url,
    alternativeTitles: item.titles?.map((t: any) => t.title) || []
  };
};

export const getAnimeGenres = async (): Promise<any[]> => {
  const result = await fetchFromJikan('/genres/anime');
  return result.data.map((g: any) => ({ id: g.mal_id, name: g.name }));
};

export const getAnilistIdFromMalId = async (malId: number | string): Promise<string | null> => {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
      }
    }
  `;
  
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { idMal: Number(malId) }
      })
    });
    
    if (!response.ok) {
       return null;
    }
    
    const data = await response.json();
    return data?.data?.Media?.id?.toString() || null;
  } catch (error) {
    console.error('Error fetching AniList ID:', error);
    return null;
  }
};

export const getMalIdFromTitle = async (title: string): Promise<string | null> => {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        idMal
      }
    }
  `;
  
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: title }
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data?.data?.Media?.idMal?.toString() || null;
  } catch (error) {
    console.error('Error fetching MAL ID from title:', error);
    return null;
  }
};

export interface AnimeDropdownResult {
  mal_id: number;
  title: string;
  image: string;
  year?: number;
  score?: number;
  format?: string;
}

export const searchAnimeDropdown = async (query: string): Promise<AnimeDropdownResult[]> => {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          idMal
          title { romaji english }
          coverImage { medium }
          averageScore
          format
          startDate { year }
        }
      }
    }
  `;
  
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: query }
      })
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const media = data?.data?.Page?.media || [];
    
    return media
      .filter((m: any) => m.idMal)
      .map((m: any) => ({
        mal_id: m.idMal,
        title: m.title.english || m.title.romaji,
        image: m.coverImage.medium,
        year: m.startDate?.year,
        score: m.averageScore,
        format: m.format,
      }));
  } catch (error) {
    console.error('Error fetching anime dropdown:', error);
    return [];
  }
};

export const fetchLatestAnimeUpdates = async (page = 1): Promise<AnimeItem[]> => {
  try {
    const response = await fetch(`https://anikotoapi.site/recent-anime?page=${page}&per_page=12`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      mal_id: parseInt(item.mal_id) || 0,
      _id: item.mal_id || item.id?.toString(),
      title: item.title,
      image: item.poster,
      images: {
        webp: {
          image_url: item.poster,
          large_image_url: item.poster,
        }
      },
      synopsis: item.description || '',
      type: 'TV',
      status: item.status,
      score: parseFloat(item.score) || 0,
      genres: [],
      rank: 0,
      episodes: parseInt(item.episodes) || 0,
    }));
  } catch (error) {
    console.error('Error fetching latest anime updates:', error);
    return [];
  }
};
