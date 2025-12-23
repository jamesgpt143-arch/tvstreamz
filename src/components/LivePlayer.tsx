import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2 } from 'lucide-react';
import Hls from 'hls.js';
import shaka from 'shaka-player/dist/shaka-player.compiled';

interface LivePlayerProps {
  channel: Channel;
}

export const LivePlayer = ({ channel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const shakaRef = useRef<shaka.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    // Cleanup HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    // Cleanup Shaka
    if (shakaRef.current) {
      shakaRef.current.destroy();
      shakaRef.current = null;
    }
    // Reset video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (channel.type === 'youtube') return;

    const loadPlayer = async () => {
      // Cleanup previous player first
      cleanup();
      
      setIsLoading(true);
      setError(null);

      try {
        if (channel.type === 'hls') {
          if (videoRef.current && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            
            hls.loadSource(channel.manifestUri);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              videoRef.current?.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                setError('Failed to load stream. The channel may be offline.');
                setIsLoading(false);
              }
            });
          } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoRef.current.src = channel.manifestUri;
            videoRef.current.addEventListener('loadedmetadata', () => {
              setIsLoading(false);
              videoRef.current?.play().catch(() => {});
            });
          }
        } else if (channel.type === 'mpd') {
          if (videoRef.current) {
            shaka.polyfill.installAll();
            
            if (!shaka.Player.isBrowserSupported()) {
              setError('Your browser does not support this stream format.');
              setIsLoading(false);
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
              setIsLoading(false);
              videoRef.current?.play().catch(() => {});
            } catch (err) {
              console.error('Shaka error:', err);
              setError('Failed to load stream. The channel may require different DRM or is offline.');
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Player error:', err);
        setError('Failed to initialize player.');
        setIsLoading(false);
      }
    };

    loadPlayer();

    return () => {
      cleanup();
    };
  }, [channel, cleanup]);

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center">
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
