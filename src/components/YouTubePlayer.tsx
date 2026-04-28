import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Loader2, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  isChannel?: boolean;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, title, isChannel = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start as false to be safe with autoplay
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sendCommand = useCallback((func: string, args: any = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: func,
          args: args,
        }),
        '*'
      );
    }
  }, []);

  const handlePlay = () => {
    sendCommand('playVideo');
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handlePause = () => {
    sendCommand('pauseVideo');
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data;
        if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else {
          data = event.data;
        }

        // Handle both 'onStateChange' and 'infoDelivery' events from YouTube API
        let state = -1;
        if (data.event === 'onStateChange') {
          state = data.info;
        } else if (data.info && data.info.playerState !== undefined) {
          state = data.info.playerState;
        }

        if (state !== -1) {
          // 1: playing, 3: buffering
          if (state === 1 || state === 3) {
            setHasStarted(true);
            setIsPlaying(true);
          } else if (state === 2) { // 2: paused
            setIsPlaying(false);
          } else if (state === 0) { // 0: ended
            setIsPlaying(false);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Reset state for new video
    setIsPlaying(false);
    setIsLoading(true);
    setHasStarted(false);
    
    // Initial play attempt
    const timer = setTimeout(() => {
      sendCommand('playVideo');
    }, 1000);

    // Poll for state to ensure sync
    const pollInterval = setInterval(() => {
      sendCommand('getPlayerState');
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
    };
  }, [videoId, sendCommand]);

  const embedUrl = isChannel 
    ? `https://www.youtube.com/embed/live_stream?channel=${videoId}&autoplay=1&enablejsapi=1&rel=0`
    : `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full group bg-black overflow-hidden select-none rounded-xl"
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
      
      {/* OVERLAY: Blocks clicks to prevent interacting with YouTube iframe directly */}
      <div 
        className="absolute inset-0 z-10 bg-transparent cursor-pointer transition-all pointer-events-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Control UI */}
      <div className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-300",
        (isPlaying && hasStarted) 
          ? "opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none" 
          : "opacity-100 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
      )}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="relative group/btn transform transition-transform hover:scale-110 active:scale-95 pointer-events-auto"
        >
          {(!isPlaying || !hasStarted) && !isLoading && (
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
          
          <div className="relative p-8 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white fill-white" />
            ) : (
              <Play className="w-12 h-12 text-white fill-white translate-x-1" />
            )}
          </div>
        </button>
        
        {/* Fullscreen Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-90"
          >
            {isFullscreen ? <Minimize className="w-6 h-6 text-white" /> : <Maximize className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Bottom Metadata - Old Version (Hidden but kept for structure if needed) */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 opacity-0">
          <p className="text-white font-bold text-xl drop-shadow-lg tracking-tight">
            {title}
          </p>
          <p className="text-white/60 text-sm mt-1 uppercase tracking-widest font-semibold">
            {isPlaying ? (isChannel ? 'Live Streaming' : 'Now Playing') : 'Paused'}
          </p>
        </div>


      </div>

      {/* Interaction Hint */}
      {!hasStarted && !isLoading && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-primary/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/20 text-white text-xs font-black tracking-[0.2em] uppercase animate-bounce shadow-xl">
            Click to Start
          </div>
        </div>
      )}
    </div>
  );
};
