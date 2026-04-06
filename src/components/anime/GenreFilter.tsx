import { Button } from '@/components/ui/button';
import { ANIME_GENRES } from '@/lib/tmdb';

interface GenreFilterProps {
  selectedGenre: number | null;
  onGenreSelect: (id: number | null) => void;
}

export const GenreFilter = ({ selectedGenre, onGenreSelect }: GenreFilterProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
      <Button
        variant={selectedGenre === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGenreSelect(null)}
        className="rounded-full px-6 flex-shrink-0 border-border/50"
      >
        All
      </Button>
      {ANIME_GENRES.map((genre) => (
        <Button
          key={genre.id}
          variant={selectedGenre === genre.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onGenreSelect(genre.id)}
          className="rounded-full px-6 flex-shrink-0 border-border/50 shadow-sm"
        >
          {genre.name}
        </Button>
      ))}
    </div>
  );
};
