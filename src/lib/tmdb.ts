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
  genre_ids?: number[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

// Genre lists
export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES: Genre[] = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

export const ANIME_GENRES: Genre[] = [
  { id: 10759, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 80, name: 'Crime' },
  { id: 10762, name: 'Kids' },
];

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
    ? `https://vidsrc-embed.ru/embed/movie/${id}?autoplay=1&mute=1` 
    : `https://vidsrc-embed.ru/embed/tv/${id}/${season}/${episode}?autoplay=1&mute=1`,
  'Server 2': type === 'movie' 
    ? `https://vidlink.pro/movie/${id}?autoplay=true` 
    : `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true`,
  'Server 3': type === 'movie' 
    ? `https://vidsrc.cc/v2/embed/movie/${id}?autoplay=1&mute=1` 
    : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoplay=1&mute=1`,
  'Server 4': type === 'movie'
    ? `https://multiembed.mov/?video_id=${id}&tmdb=1&autoplay=1`
    : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}&autoplay=1`,
  'Server 5': type === 'movie'
    ? `https://zxcstream.xyz/embed/movie/${id}?autoplay=1`
    : `https://zxcstream.xyz/embed/tv/${id}/${season}/${episode}?autoplay=1`,
  'Server 6': type === 'movie'
    ? `https://vidapi.xyz/embed/movie/${id}`
    : `https://vidapi.xyz/embed/tv/${id}/${season}/${episode}`,
});

export const fetchSeasonDetails = async (tvId: number, seasonNumber: number): Promise<{ episodes: Episode[] }> => {
  const response = await fetch(`${API_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
  return response.json();
};

// Anime functions - using animation genre (16) and Japanese origin
export const fetchAnimeTV = async (page = 1): Promise<TVShow[]> => {
  const response = await fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchAnimeMovies = async (page = 1): Promise<Movie[]> => {
  const response = await fetch(`${API_BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchTopRatedAnime = async (page = 1): Promise<TVShow[]> => {
  const response = await fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchAiringAnime = async (page = 1): Promise<TVShow[]> => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // Using discover/tv to ensure genre filtering works, and strictly for Japanese shows currently airing
  const response = await fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&air_date.gte=${today}&air_date.lte=${nextWeek}&page=${page}`);
  const data = await response.json();
  return data.results;
};

export const fetchNewAnimeEpisodes = async (page = 1): Promise<TVShow[]> => {
  // Get animation that aired within the last 7 days
  const response = await fetch(`${API_BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&air_date.lte=${new Date().toISOString().split('T')[0]}&air_date.gte=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=first_air_date.desc&page=${page}`);
  const data = await response.json();
  return data.results;
};

// Fetch videos/trailers
export const fetchVideos = async (id: number, type: 'movie' | 'tv'): Promise<Video[]> => {
  const response = await fetch(`${API_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results || [];
};

// Get YouTube trailer URL
export const getTrailerUrl = (videos: Video[]): string | null => {
  const trailer = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
  if (trailer) {
    return `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
  }
  return null;
};

// Discover with filters
export const discoverContent = async (
  type: 'movie' | 'tv',
  options: {
    page?: number;
    genre?: number;
    year?: number;
    minRating?: number;
    sortBy?: string;
    originalLanguage?: string;
  } = {}
): Promise<Movie[] | TVShow[]> => {
  const { page = 1, genre, year,    minRating, 
    sortBy = 'popularity.desc', 
    originalLanguage 
  } = options;
  
  const today = new Date().toISOString().split('T')[0];
  let url = `${API_BASE_URL}/discover/${type}?api_key=${API_KEY}&page=${page}&sort_by=${sortBy}`;
  
  // Filter out items that are not released yet
  if (type === 'movie') {
    url += `&primary_release_date.lte=${today}`;
  } else {
    url += `&air_date.lte=${today}`;
  }

  if (genre) url += `&with_genres=${genre}`;
  if (originalLanguage) url += `&with_original_language=${originalLanguage}`;
  if (year) {
    if (type === 'movie') {
      url += `&primary_release_year=${year}`;
    } else {
      url += `&first_air_date_year=${year}`;
    }
  }
  if (minRating) url += `&vote_average.gte=${minRating}&vote_count.gte=50`;
  
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
};

/**
 * Searches TMDB for a title and returns the most relevant ID and media type.
 * Used for mapping external anime titles to TMDB for streaming.
 */
export const findTMDBIdByTitle = async (title: string): Promise<{ id: number; type: 'movie' | 'tv' } | null> => {
  // We search for both movie and tv. Usually anime series are 'tv'.
  const response = await fetch(`${API_BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(title)}`);
  const data = await response.json();
  
  // Filter for movies and tv shows, sorted by popularity
  const results = data.results
    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
    .sort((a: any, b: any) => b.popularity - a.popularity);

  if (results.length > 0) {
    const bestMatch = results[0];
    return {
      id: bestMatch.id,
      type: bestMatch.media_type as 'movie' | 'tv'
    };
  }

  return null;
};
