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
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
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
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10",
            "backdrop-blur-md border",
            isFavorite 
              ? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
              : "bg-black/40 border-white/10 text-white/70 hover:bg-black/60 hover:text-white"
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
