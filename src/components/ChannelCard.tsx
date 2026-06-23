import { Link } from 'react-router-dom';
import { Channel } from '@/lib/channels';
import { useProxyLogo } from '@/hooks/useProxyLogo';
import { Heart } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChannelCardProps {
  channel: Channel;
}

export const ChannelCard = ({ channel }: ChannelCardProps) => {
  const { proxyLogo } = useProxyLogo();
  const { isInMyList, addToMyList, removeFromMyList } = useUserPreferences();
  
  const isFavorite = isInMyList(channel.id, 'channel');

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite) {
      removeFromMyList(channel.id, 'channel');
      toast.success(`${channel.name} removed from favorites`);
    } else {
      addToMyList({
        id: channel.id,
        type: 'channel',
        title: channel.name,
        poster_path: channel.logo,
      });
      toast.success(`${channel.name} added to favorites`);
    }
  };

  return (
    <Link
      to={`/live/${channel.id}`}
      className="group flex flex-col items-center gap-2 relative"
    >
      <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-card border border-primary/30 shadow-md transition-all duration-500 group-hover:scale-105 group-hover:border-primary/70 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
        <img
          src={proxyLogo(channel.logo)}
          alt={channel.name}
          className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={cn(
            "hidden md:flex absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center transition-all duration-300 z-10",
            "backdrop-blur-md border",
            isFavorite 
              ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
              : "bg-foreground/5 border-border text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4 transition-transform duration-300", isFavorite && "fill-current scale-110")} />
        </button>

      </div>

      <span className="text-xs sm:text-sm font-bold text-center text-foreground group-hover:text-primary transition-colors leading-tight px-1">
        {channel.name}
      </span>
    </Link>
  );
};
