import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseDate: string | null;
  variant?: 'icon' | 'full';
  className?: string;
}

export const WatchlistButton = ({
  contentId,
  contentType,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  variant = 'icon',
  className,
}: WatchlistButtonProps) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, user } = useWatchlist();
  const [isLoading, setIsLoading] = useState(false);

  const inWatchlist = isInWatchlist(contentId, contentType);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(contentId, contentType);
      } else {
        await addToWatchlist({
          content_id: contentId,
          content_type: contentType,
          title,
          poster_path: posterPath,
          vote_average: voteAverage,
          release_date: releaseDate,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'full') {
    return (
      <Button
        onClick={handleClick}
        variant={inWatchlist ? 'secondary' : 'outline'}
        className={cn('gap-2', className)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={cn('w-4 h-4', inWatchlist && 'fill-current text-red-500')} />
        )}
        {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="icon"
      className={cn(
        'rounded-full bg-background/80 backdrop-blur-sm hover:bg-background',
        className
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={cn('w-4 h-4', inWatchlist && 'fill-red-500 text-red-500')} />
      )}
    </Button>
  );
};
