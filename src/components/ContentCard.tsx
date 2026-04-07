import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
import { Movie, TVShow, getImageUrl } from '@/lib/tmdb';

interface ContentCardProps {
  item: Movie | TVShow;
  type?: 'movie' | 'tv';
}

const getRatingColor = (rating: number) => {
  if (rating >= 8) return 'text-green-400 bg-green-400/20';
  if (rating >= 6) return 'text-yellow-400 bg-yellow-400/20';
  return 'text-red-400 bg-red-400/20';
};

export const ContentCard = ({ item, type }: ContentCardProps) => {
  const title = 'title' in item ? item.title : item.name;
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  const mediaType = type || item.media_type || 'movie';
  const year = date ? new Date(date).getFullYear() : '';
  const rating = item.vote_average;

  return (
    <Link
      to={`/watch/${mediaType}/${item.id}`}
      className="group relative block rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-zinc-900 border border-white/5 active:scale-95"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
          loading="lazy"
        />
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-110 group-hover:scale-100">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <Play className="w-6 h-6 text-black ml-1 fill-black" />
          </div>
        </div>

        {/* Rating and Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 scale-90 origin-top-right group-hover:scale-100 transition-transform duration-300">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-md shadow-lg border border-white/10 font-black ${getRatingColor(rating || 0)}`}>
            <Star className="w-3 h-3" fill="currentColor" />
            <span className="text-[10px]">{(rating || 0).toFixed(1)}</span>
          </div>
          
          {(rating || 0) >= 7 && (
            <div className="px-2 py-0.5 rounded-lg bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest text-center shadow-lg">
              ULTRA HD
            </div>
          )}
        </div>
      </div>

      {/* Modern Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-sm text-white line-clamp-1 mb-1 drop-shadow-lg">
          {title}
        </h3>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
          <span className="text-[10px] text-zinc-400 font-bold">{year}</span>
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 uppercase font-black tracking-widest">
            {mediaType === 'movie' ? 'Movie' : 'TV Series'}
          </span>
        </div>
      </div>
    </Link>
  );
};
