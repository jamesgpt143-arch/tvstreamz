import { useState, useEffect } from 'react';
import { Season, Episode, fetchSeasonDetails, getImageUrl } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EpisodePickerProps {
  tvId: number;
  seasons: Season[];
  onSelect: (season: number, episode: number) => void;
  currentSeason: number;
  currentEpisode: number;
}

export const EpisodePicker = ({
  tvId,
  seasons,
  onSelect,
  currentSeason,
  currentEpisode,
}: EpisodePickerProps) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out specials (season 0) and sort
  const validSeasons = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  useEffect(() => {
    const loadEpisodes = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSeasonDetails(tvId, selectedSeason);
        setEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Failed to load episodes:', error);
        setEpisodes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisodes();
  }, [tvId, selectedSeason]);

  const handleSeasonChange = (value: string) => {
    setSelectedSeason(Number(value));
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Episodes</h3>
        
        {/* Season Selector */}
        <Select value={String(selectedSeason)} onValueChange={handleSeasonChange}>
          <SelectTrigger className="w-[160px] bg-secondary border-border">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {validSeasons.map((season) => (
              <SelectItem key={season.id} value={String(season.season_number)}>
                Season {season.season_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Episodes List */}
      <ScrollArea className="h-[300px] pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : episodes.length > 0 ? (
          <div className="space-y-2">
            {episodes.map((episode) => {
              const isActive = 
                selectedSeason === currentSeason && 
                episode.episode_number === currentEpisode;
              
              return (
                <button
                  key={episode.id}
                  onClick={() => onSelect(selectedSeason, episode.episode_number)}
                  className={`w-full flex gap-3 p-2 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-primary/20 border border-primary/50'
                      : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                  }`}
                >
                  {/* Episode Thumbnail */}
                  <div className="relative w-24 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, 'w300')}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-foreground" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      E{episode.episode_number}. {episode.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {episode.overview || 'No description available'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No episodes found
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
