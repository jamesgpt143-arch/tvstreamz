import { Link } from 'react-router-dom';
import { Radio, Play } from 'lucide-react';
import { Channel } from '@/lib/channels';

interface ChannelCardProps {
  channel: Channel;
}

export const ChannelCard = ({ channel }: ChannelCardProps) => {
  return (
    <Link
      to={`/live/${channel.id}`}
      className="group relative block rounded-xl overflow-hidden card-hover bg-card border border-border"
    >
      <div className="aspect-square sm:aspect-video relative">
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain p-2 sm:p-4 bg-secondary/50"
          loading="lazy"
        />
        
        {/* Live indicator */}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] sm:text-xs font-medium">
          <Radio className="w-2 h-2 sm:w-3 sm:h-3 animate-pulse" />
          <span className="hidden sm:inline">LIVE</span>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/40">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <h3 className="font-semibold text-xs sm:text-base group-hover:text-primary transition-colors line-clamp-1">
          {channel.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 uppercase hidden sm:block">
          {channel.type === 'youtube' ? 'YouTube Stream' : 'Live Stream'}
        </p>
      </div>
    </Link>
  );
};
