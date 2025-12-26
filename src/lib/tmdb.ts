const API_KEY = '2283c405a7e1d26a6b72a786916aad85';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  genre_ids?: number[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview: string;
  still_path: string | null;
  air_date: string;
}

export interface MovieDetails extends Movie {
  runtime?: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  tagline?: string;
  status: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  media_type?: string;
}

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const fetchTrending = async (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results;
};

export const fetchPopularMovies = async (page = 1): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchPopularTV = async (page = 1): Promise<TVShow[]> => {
  const response = await fetch(`${API_BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchTopRatedMovies = async (page = 1): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchTopRatedTV = async (page = 1): Promise<TVShow[]> => {
  const response = await fetch(`${API_BASE_URL}/tv/top_rated?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const response = await fetch(`${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
  return response.json();
};

export const fetchTVDetails = async (tvId: number): Promise<MovieDetails> => {
  const response = await fetch(`${API_BASE_URL}/tv/${tvId}?api_key=${API_KEY}`);
  return response.json();
};

export const searchMulti = async (query: string, page = 1): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
  const data = await response.json();
  return data.results.filter((item: Movie) => item.media_type === 'movie' || item.media_type === 'tv');
};

export const fetchNowPlaying = async (): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results;
};

export const fetchUpcoming = async (): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/movie/upcoming?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results;
};

export const getStreamingUrls = (id: number, type: 'movie' | 'tv', season?: number, episode?: number) => ({
  'Server 1': type === 'movie' 
    ? `https://vidlink.pro/movie/${id}` 
    : `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  'Server 2': type === 'movie'
    ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
    : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  'Server 3': type === 'movie'
    ? `https://zxcstream.xyz/embed/movie/${id}`
    : `https://zxcstream.xyz/embed/tv/${id}/${season}/${episode}`,
  'Server 4': type === 'movie'
    ? `https://zxcstream.xyz/player/movie/${id}/en`
    : `https://zxcstream.xyz/embed/tv/${id}/${season}/${episode}`,
});

export const fetchSeasonDetails = async (tvId: number, seasonNumber: number): Promise<{ episodes: Episode[] }> => {
  const response = await fetch(`${API_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
  return response.json();
};
