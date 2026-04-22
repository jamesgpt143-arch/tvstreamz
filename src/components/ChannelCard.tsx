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
      className="group flex flex-col items-center gap-4"
    >
      <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden glass-card transition-all duration-700 group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] group-hover:border-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <img
          src={proxyLogo(channel.logo)}
          alt={channel.name}
          className="w-full h-full object-contain p-6 transition-all duration-700 group-hover:scale-110 drop-shadow-2xl"
          loading="lazy"
        />

        {/* Offline overlay - refined */}
        {channel.status === 'offline' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[8px] uppercase font-black tracking-[0.2em] text-zinc-500 glass-card px-3 py-1.5 rounded-full border-white/5">
              OFFLINE
            </span>
          </div>
        )}
      </div>

      <span className="text-[11px] font-black uppercase tracking-widest text-center text-zinc-400 group-hover:text-primary transition-all duration-500 leading-tight px-2 group-hover:scale-105">
        {channel.name}
      </span>
    </Link>
  );
};
