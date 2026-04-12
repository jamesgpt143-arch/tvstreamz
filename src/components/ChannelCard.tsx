import { Link } from 'react-router-dom';
import { Channel } from '@/lib/channels';
import { useProxyLogo } from '@/hooks/useProxyLogo';

interface ChannelCardProps {
  channel: Channel;
}

export const ChannelCard = ({ channel }: ChannelCardProps) => {
  const { proxyLogo } = useProxyLogo();
  return (
    <Link
      to={`/live/${channel.id}`}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
        <img
          src={proxyLogo(channel.logo)}
          alt={channel.name}
          className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Offline overlay */}
        {channel.status === 'offline' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 bg-zinc-800/90 px-2 py-1 rounded-full border border-white/5">
              Offline
            </span>
          </div>
        )}
      </div>

      <span className="text-xs sm:text-sm font-bold text-center text-foreground group-hover:text-primary transition-colors leading-tight px-1">
        {channel.name}
      </span>
    </Link>
  );
};
