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
      className="group relative block rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] glass-card border-white/5 active:scale-95"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={title}
          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
          loading="lazy"
        />
        
        {/* Advanced Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-all duration-700" />
        <div className="absolute inset-0 bg-mesh opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
        
        {/* Play Icon with Glow */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 scale-125 group-hover:scale-100">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.6)]">
            <Play className="w-7 h-7 text-black ml-1 fill-black" />
          </div>
        </div>

        {/* Dynamic Rating & Quality Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 origin-top-right group-hover:scale-100 transition-all duration-500">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl border border-white/10 font-black shadow-2xl ${getRatingColor(rating || 0)}`}>
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] tracking-tighter">{(rating || 0).toFixed(1)}</span>
          </div>
          
          {(rating || 0) >= 7.5 && (
            <div className="px-3 py-1 rounded-xl bg-secondary/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.2em] text-center border border-white/10 shadow-lg animate-pulse-slow">
              MUST WATCH
            </div>
          )}
        </div>
      </div>

      {/* Elegant Info Mask */}
      <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-700">
        <h3 className="font-black text-sm text-white line-clamp-1 mb-1.5 tracking-tight group-hover:text-primary transition-colors duration-500">
          {title}
        </h3>
        <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 translate-y-2 group-hover:translate-y-0">
          <span className="text-[10px] text-zinc-400 font-black tracking-widest">{year}</span>
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="text-[8px] px-2.5 py-1 rounded-full glass-card border-white/5 text-zinc-400 uppercase font-black tracking-[0.2em]">
            {mediaType === 'movie' ? 'CINEMA' : 'SERIES'}
          </span>
        </div>
      </div>
    </Link>
  );
};
