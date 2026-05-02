const RAPIDAPI_KEY = 'e723dc4049msh26a38bbeb7362c8p155220jsnaba54e3cd788';
const RAPIDAPI_HOST = 'anime-db.p.rapidapi.com';
const BASE_URL = 'https://anime-db.p.rapidapi.com';

export interface AnimeItem {
  _id: string;
  title: string;
  image: string;
  link: string;
  status: string;
  type: string;
  thumb: string;
  genres: string[];
  ranking: number;
  episodes: number;
}

export interface AnimeDetails extends AnimeItem {
  synopsis: string;
  alternativeTitles: string[];
  hasEpisode: boolean;
  hasRanking: boolean;
}

export interface AnimeResponse {
  data: AnimeItem[];
  meta: {
    page: number;
    size: number;
    totalData: number;
    totalPage: number;
  };
}

const fetchFromAnimeDB = async (endpoint: string, params: Record<string, string | number> = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key].toString()));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Anime DB API Error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchAnimeList = async (page = 1, size = 20, search = '', genres = '', sortBy = 'ranking', sortOrder = 'asc'): Promise<AnimeResponse> => {
  const params: Record<string, string | number> = { page, size, sortBy, sortOrder };
  if (search) params.search = search;
  if (genres) params.genres = genres;
  
  return fetchFromAnimeDB('/anime', params);
};

export const getAnimeById = async (id: string): Promise<AnimeDetails> => {
  return fetchFromAnimeDB(`/anime/by-id/${id}`);
};

export const getAnimeGenres = async (): Promise<string[]> => {
  return fetchFromAnimeDB('/anime/genres');
};
