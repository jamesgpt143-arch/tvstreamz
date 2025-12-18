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
      <div className="aspect-video relative">
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain p-4 bg-secondary/50"
          loading="lazy"
        />
        
        {/* Live indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium">
          <Radio className="w-3 h-3 animate-pulse" />
          LIVE
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/40">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {channel.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 uppercase">
          {channel.type === 'youtube' ? 'YouTube Stream' : 'Live Stream'}
        </p>
      </div>
    </Link>
  );
};
