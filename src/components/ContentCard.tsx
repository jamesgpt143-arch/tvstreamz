import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';
import { Movie, TVShow, getImageUrl } from '@/lib/tmdb';

interface ContentCardProps {
  item: Movie | TVShow;
  type?: 'movie' | 'tv';
}

export const ContentCard = ({ item, type }: ContentCardProps) => {
  const title = 'title' in item ? item.title : item.name;
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  const mediaType = type || item.media_type || 'movie';
  const year = date ? new Date(date).getFullYear() : '';

  return (
    <Link
      to={`/watch/${mediaType}/${item.id}`}
      className="group relative block rounded-xl overflow-hidden card-hover"
    >
      <div className="aspect-[2/3] relative">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm">
          <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
          <span className="text-xs font-medium">{item.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{year}</p>
      </div>
    </Link>
  );
};
