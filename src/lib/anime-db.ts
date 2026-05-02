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
