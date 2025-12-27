import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2 } from 'lucide-react';
import Hls from 'hls.js';
import shaka from 'shaka-player/dist/shaka-player.compiled';

interface LivePlayerProps {
  channel: Channel;
  onStatusChange?: (isOnline: boolean) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

// Inner component that handles the actual player
const PlayerCore = ({ channel, onStatusChange, onSwipeLeft, onSwipeRight }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const shakaRef = useRef<shaka.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Swipe detection refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update parent about online status
  useEffect(() => {
    onStatusChange?.(!error);
  }, [error, onStatusChange]);

  // Swipe handlers for fullscreen
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 80;
    const diff = touchStartX.current - touchEndX.current;
    
    // Only trigger swipe in fullscreen mode
    const isFullscreen = document.fullscreenElement !== null;
    
    if (isFullscreen && Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - next channel
        onSwipeLeft?.();
      } else {
        // Swiped right - previous channel
        onSwipeRight?.();
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [onSwipeLeft, onSwipeRight]);

  // Add touch listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    let isMounted = true;

    const loadPlayer = async () => {
      if (!videoRef.current) return;
      
      setIsLoading(true);
      setError(null);

      try {
        if (channel.type === 'hls') {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsRef.current = hls;
            
            hls.loadSource(channel.manifestUri);
            hls.attachMedia(videoRef.current);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (isMounted) {
                setIsLoading(false);
                videoRef.current?.play().catch(() => {});
              }
            });
            
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal && isMounted) {
                setError('Failed to load stream. The channel may be offline.');
                setIsLoading(false);
              }
            });
          } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoRef.current.src = channel.manifestUri;
            const handleLoaded = () => {
              if (isMounted) {
                setIsLoading(false);
                videoRef.current?.play().catch(() => {});
              }
            };
            videoRef.current.addEventListener('loadedmetadata', handleLoaded);
          }
        } else if (channel.type === 'mpd') {
          shaka.polyfill.installAll();
          
          if (!shaka.Player.isBrowserSupported()) {
            if (isMounted) {
              setError('Your browser does not support this stream format.');
              setIsLoading(false);
            }
            return;
          }

          const player = new shaka.Player();
          shakaRef.current = player;
          await player.attach(videoRef.current);

          player.configure({
            drm: {
              clearKeys: channel.clearKey || {},
              servers: channel.widevineUrl
                ? { 'com.widevine.alpha': channel.widevineUrl }
                : {},
            },
          });

          try {
            await player.load(channel.manifestUri);
            if (isMounted) {
              setIsLoading(false);
              videoRef.current?.play().catch(() => {});
            }
          } catch (err) {
            console.error('Shaka error:', err);
            if (isMounted) {
              setError('Failed to load stream. The channel may require different DRM or is offline.');
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Player error:', err);
        if (isMounted) {
          setError('Failed to initialize player.');
          setIsLoading(false);
        }
      }
    };

    loadPlayer();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      if (shakaRef.current) {
        shakaRef.current.destroy().catch(() => {});
        shakaRef.current = null;
      }
    };
  }, [channel.manifestUri, channel.type, channel.clearKey, channel.widevineUrl]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center z-10">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
};

export const LivePlayer = ({ channel, onStatusChange, onSwipeLeft, onSwipeRight }: LivePlayerProps) => {
  if (channel.type === 'youtube') {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border">
        <iframe
          src={`${channel.embedUrl}&autoplay=1`}
          title={channel.name}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border relative">
      {/* Key forces complete remount when channel changes */}
      <PlayerCore 
        key={channel.id} 
        channel={channel} 
        onStatusChange={onStatusChange}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />
    </div>
  );
};