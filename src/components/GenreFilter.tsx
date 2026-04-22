import { Genre } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface GenreFilterProps {
  genres: Genre[];
  selectedGenre: number | null;
  onSelectGenre: (genreId: number | null) => void;
}

export const GenreFilter = ({ genres, selectedGenre, onSelectGenre }: GenreFilterProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedGenre === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectGenre(null)}
          className="shrink-0"
        >
          All
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedGenre === genre.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectGenre(genre.id)}
            className="shrink-0"
          >
            {genre.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
