import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { Manga } from '@/lib/mangadex';

interface MangaCardProps {
  manga: Manga;
}

export const MangaCard = ({ manga }: MangaCardProps) => {
  return (
    <Link
      to={`/manga/${manga.id}`}
      className="group relative block rounded-xl overflow-hidden bg-card transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
      {/* Cover Image */}
      <div className="aspect-[2/3] relative">
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            manga.status === 'completed' 
              ? 'bg-green-500/90 text-white' 
              : manga.status === 'ongoing'
              ? 'bg-blue-500/90 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            {manga.status === 'completed' ? 'Tapos' : manga.status === 'ongoing' ? 'Ongoing' : manga.status}
          </span>
        </div>

        {/* Content Rating */}
        {manga.contentRating && manga.contentRating !== 'safe' && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/90 text-white uppercase">
              {manga.contentRating}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {manga.title}
        </h3>
        {manga.year && (
          <p className="text-xs text-muted-foreground mt-1">{manga.year}</p>
        )}
        {manga.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-secondary rounded text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};
