import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2, Subtitles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePlayerProps {
  channel: Channel;
}

export const LivePlayer = ({ channel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const destroyPlayers = useCallback(async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying Shaka player:', e);
      }
      playerRef.current = null;
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.error('Error destroying HLS:', e);
      }
      hlsRef.current = null;
    }
  }, []);

  const loadChannel = useCallback(async () => {
    if (channel.type === 'youtube') return;

    await destroyPlayers();
    setIsLoading(true);
    setError(null);
    setHasSubtitles(false);

    try {
      if (channel.type === 'hls') {
        // Dynamic import for HLS.js
        const Hls = (await import('hls.js')).default;
        
        if (videoRef.current && Hls.isSupported()) {
          const hls = new Hls({
            enableWebVTT: true,
            enableIMSC1: true,
            enableCEA708Captions: true,
          });
          hlsRef.current = hls;
          
          hls.loadSource(channel.manifestUri);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            // Check for subtitles
            if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
              setHasSubtitles(true);
              hls.subtitleTrack = 0;
              hls.subtitleDisplay = subtitlesEnabled;
            }
            videoRef.current?.play().catch(() => {});
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setError('Failed to load stream. The channel may be offline.');
              setIsLoading(false);
            }
          });
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
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
          playerRef.current = player;

          // Configure player
          player.configure({
            drm: {
              clearKeys: channel.clearKey || {},
              servers: channel.widevineUrl
                ? { 'com.widevine.alpha': channel.widevineUrl }
                : {},
            },
            streaming: {
              bufferingGoal: 15,
              rebufferingGoal: 2,
              alwaysStreamText: true,
              retryParameters: {
                maxAttempts: 3,
                baseDelay: 1000,
                backoffFactor: 2,
                fuzzFactor: 0.5,
              }
            },
            preferredTextLanguage: 'en',
          });

          // Error handling
          player.addEventListener('error', (event: any) => {
            const errorDetail = event.detail;
            console.error('Shaka error:', errorDetail);
            
            if (errorDetail.category === shaka.default.util.Error.Category.NETWORK) {
              setError('Network Error: Stream is unreachable or blocked.');
            } else if (errorDetail.category === shaka.default.util.Error.Category.MANIFEST) {
              setError('Stream Error: Invalid link or stream ended.');
            } else {
              setError(`Playback Error: ${errorDetail.message || 'Unknown error'}`);
            }
            setIsLoading(false);
          });

          try {
            await player.load(channel.manifestUri);
            setIsLoading(false);
            
            // Auto-select subtitles if available
            const textTracks = player.getTextTracks();
            console.log('Available text tracks:', textTracks);
            
            if (textTracks && textTracks.length > 0) {
              setHasSubtitles(true);
              
              // Try to find English track first
              const englishTrack = textTracks.find((track: any) => 
                track.language === 'en' || track.language === 'eng'
              );
              
              if (englishTrack) {
                player.selectTextTrack(englishTrack);
              } else {
                // Select first available track
                player.selectTextTrack(textTracks[0]);
              }
              
              // Enable subtitle visibility
              player.setTextTrackVisibility(subtitlesEnabled);
            }
            
            videoRef.current?.play().catch(() => {
              console.log("Autoplay blocked, waiting for user interaction");
            });
          } catch (err) {
            console.error('Shaka load error:', err);
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
  }, [channel, destroyPlayers, subtitlesEnabled]);

  useEffect(() => {
    loadChannel();

    return () => {
      destroyPlayers();
    };
  }, [channel, retryCount]);

  // Toggle subtitles
  const toggleSubtitles = () => {
    const newState = !subtitlesEnabled;
    setSubtitlesEnabled(newState);
    
    if (playerRef.current) {
      playerRef.current.setTextTrackVisibility(newState);
    }
    
    if (hlsRef.current) {
      hlsRef.current.subtitleDisplay = newState;
    }
    
    // Also toggle native video text tracks
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = newState ? 'showing' : 'hidden';
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

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
    <div className="relative">
      <div 
        ref={containerRef}
        className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border relative"
      >
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center z-10">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button 
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="gap-2 mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
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

      {/* Subtitle Controls */}
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant={subtitlesEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleSubtitles}
          className="gap-2"
        >
          <Subtitles className="w-4 h-4" />
          {subtitlesEnabled ? 'Subtitles On' : 'Subtitles Off'}
        </Button>
        {hasSubtitles && (
          <span className="text-xs text-green-500">
            ✓ Subtitles available
          </span>
        )}
        {!hasSubtitles && !isLoading && !error && (
          <span className="text-xs text-muted-foreground">
            No subtitles found
          </span>
        )}
      </div>
    </div>
  );
};
