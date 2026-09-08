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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isPlaying && hasStarted) {
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, hasStarted]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, hasStarted, resetControlsTimeout]);

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

        let state = -1;
        if (data.event === 'onStateChange') {
          state = data.info;
        } else if (data.info && data.info.playerState !== undefined) {
          state = data.info.playerState;
        }

        if (state !== -1) {
          if (state === 1 || state === 3) {
            setHasStarted(true);
            setIsPlaying(true);
          } else if (state === 2) {
            setIsPlaying(false);
          } else if (state === 0) {
            setIsPlaying(false);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setHasStarted(false);
    
    const timer = setTimeout(() => {
      sendCommand('playVideo');
    }, 1000);

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
      className="relative w-full h-full bg-black overflow-hidden select-none rounded-xl"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full pointer-events-none"
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
          resetControlsTimeout();
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Control UI */}
      <div className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-500 pointer-events-none",
        (!isPlaying || !hasStarted) 
          ? "opacity-100 bg-black/40 backdrop-blur-[2px]" 
          : showControls
            ? "opacity-100 bg-black/20"
            : "opacity-0"
      )}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
            resetControlsTimeout();
          }}
          className={cn(
            "relative transform transition-transform hover:scale-110 active:scale-95",
            (!isPlaying || !hasStarted || showControls) ? "pointer-events-auto" : "pointer-events-none"
          )}
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
              resetControlsTimeout();
            }}
            className={cn(
              "p-3 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-90",
              (!isPlaying || !hasStarted || showControls) ? "pointer-events-auto" : "pointer-events-none"
            )}
          >
            {isFullscreen ? <Minimize className="w-6 h-6 text-white" /> : <Maximize className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Bottom Metadata */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-all duration-500",
          (!isPlaying || !hasStarted || showControls) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
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
