import { useEffect, useRef, useState } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LivePlayerProps {
  channel: Channel;
}

export const LivePlayer = ({ channel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channel.type === 'youtube') return;

    const loadPlayer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (channel.type === 'hls') {
          // Dynamic import for HLS.js
          const Hls = (await import('hls.js')).default;
          
          if (videoRef.current && Hls.isSupported()) {
            const hls = new Hls();
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
          // Dynamic import for Shaka Player
          const shaka = await import('shaka-player/dist/shaka-player.compiled');
          
          if (videoRef.current) {
            shaka.default.polyfill.installAll();
            
            if (!shaka.default.Player.isBrowserSupported()) {
              setError('Your browser does not support this stream format.');
              setIsLoading(false);
              return;
            }

            const player = new shaka.default.Player();
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
  }, [channel]);

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
