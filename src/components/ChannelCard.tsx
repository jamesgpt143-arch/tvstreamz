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
      className="group relative block rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-zinc-900 border border-white/5"
    >
      <div className="aspect-square sm:aspect-video relative overflow-hidden bg-zinc-950/50">
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain p-6 sm:p-10 transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Cinematic Live indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-[10px] uppercase font-black tracking-widest shadow-xl shadow-red-600/20">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>LIVE</span>
        </div>

        {/* Premium Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-black ml-1 fill-black" />
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-black text-sm sm:text-lg text-white group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">
          {channel.name}
        </h3>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-black tracking-[0.2em]">
          {channel.type === 'youtube' ? 'Digital Stream' : 'Live Broadcast'}
        </p>
      </div>
    </Link>
  );
};
