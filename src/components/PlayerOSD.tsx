import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

interface PlayerOSDProps {
  channelName: string;
  channelLogo?: string;
  channelNumber?: string | number;
  programTitle?: string;
  programProgress?: number; // 0 to 100
  isVisible: boolean;
}

export const PlayerOSD: React.FC<PlayerOSDProps> = ({
  channelName,
  channelLogo,
  channelNumber,
  programTitle = 'Live Stream',
  programProgress = 0,
  isVisible
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div 
      className={cn(
        "absolute inset-0 z-40 flex flex-col justify-between p-6 transition-all duration-700 ease-in-out pointer-events-none select-none",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Top Section: Clock & Badge */}
      <div className="flex justify-end items-start pt-2">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Live</span>
          </div>
          <div className="px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <span className="text-sm font-bold text-white tabular-nums tracking-wider">
              {formatTime(time)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Channel & Program Info */}
      <div className="w-full max-w-4xl mx-auto space-y-4 animate-slide-up">
        <div className="p-6 rounded-[2.5rem] bg-black/40 backdrop-blur-[40px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
          {/* Decorative Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative flex items-center gap-6">
            {/* Channel Number & Logo */}
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              {channelNumber && (
                <span className="text-4xl font-black text-white/20 tabular-nums italic">
                  {String(channelNumber).padStart(3, '0')}
                </span>
              )}
              {channelLogo && (
                <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <img src={channelLogo} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Now</span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>
              <h2 className="text-2xl font-bold text-white truncate drop-shadow-md mb-2">
                {programTitle}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${programProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white/40 tabular-nums uppercase tracking-widest">
                  {channelName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}} />
    </div>
  );
};
