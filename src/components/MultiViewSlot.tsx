import { useState, useRef } from 'react';
import { Channel } from '@/lib/channels';
import { LivePlayer } from './LivePlayer';
import { useProxyLogo } from '@/hooks/useProxyLogo';
import { Volume2, VolumeX, Plus, RefreshCw, X, Maximize2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MultiViewSlotProps {
  slotIndex: number;
  channel: Channel | null;
  isMuted: boolean;
  onOpenSelector: (slotIndex: number) => void;
  onToggleMute: (slotIndex: number) => void;
  onRemoveChannel: (slotIndex: number) => void;
}

export const MultiViewSlot = ({
  slotIndex,
  channel,
  isMuted,
  onOpenSelector,
  onToggleMute,
  onRemoveChannel,
}: MultiViewSlotProps) => {
  const { proxyLogo } = useProxyLogo();
  const slotRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!slotRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
    } else {
      slotRef.current.requestFullscreen().catch(err => console.warn(err));
    }
  };

  if (!channel) {
    return (
      <div 
        onClick={() => onOpenSelector(slotIndex)}
        className="relative w-full h-full min-h-[180px] rounded-2xl border-2 border-dashed border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/50 transition-all flex flex-col items-center justify-center p-4 cursor-pointer group shadow-inner"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          Add Stream {slotIndex + 1}
        </p>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Click to choose a Live TV Channel
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={slotRef}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-border/80 group shadow-xl flex flex-col"
    >
      {/* Stream Area */}
      <div className="relative flex-1 w-full h-full min-h-[180px] bg-black">
        <LivePlayer channel={channel} />

        {/* Mute Overlay Mask if muted */}
        {isMuted && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 text-white/80 text-[10px] font-bold backdrop-blur-md">
            <VolumeX className="w-3 h-3 text-destructive" />
            <span>MUTED</span>
          </div>
        )}

        {/* Top Control Bar (Visible on Hover / Touch) */}
        <div className="absolute top-0 inset-x-0 z-30 p-2 sm:p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between gap-2">
          {/* Channel Name & Logo Badge */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 max-w-[65%] truncate">
            {channel.logo ? (
              <img 
                src={proxyLogo(channel.logo)} 
                alt={channel.name} 
                className="w-4 h-4 object-contain rounded"
              />
            ) : (
              <Tv className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="text-xs font-bold text-white truncate">{channel.name}</span>
          </div>

          {/* Quick Slot Actions */}
          <div className="flex items-center gap-1">
            {/* Audio Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleMute(slotIndex)}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
              className={cn(
                "w-8 h-8 rounded-full backdrop-blur-md border transition-all",
                isMuted 
                  ? "bg-black/60 border-white/10 text-white/70 hover:bg-black/80" 
                  : "bg-primary text-black border-primary font-bold hover:bg-primary/90"
              )}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {/* Change Channel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenSelector(slotIndex)}
              title="Change Channel"
              className="w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white/80 hover:bg-black/80 hover:text-white backdrop-blur-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            {/* Fullscreen Slot */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              title="Fullscreen Slot"
              className="w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white/80 hover:bg-black/80 hover:text-white backdrop-blur-md"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>

            {/* Remove Stream */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveChannel(slotIndex)}
              title="Remove Channel"
              className="w-8 h-8 rounded-full bg-destructive/80 border border-destructive text-white hover:bg-destructive backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
