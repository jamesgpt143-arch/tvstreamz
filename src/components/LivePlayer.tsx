import { useEffect, useRef, useState, useMemo } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone } from 'lucide-react';
import Hls from 'hls.js';
// IMPORTANT: Import Shaka Player UI with CSS for styled controls
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

// Detect iOS devices
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

interface LivePlayerProps {
  channel: Channel;
  onStatusChange?: (isOnline: boolean) => void;
}

// Inner component that handles the actual player
const PlayerCore = ({ channel, onStatusChange }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the UI container
  const hlsRef = useRef<Hls | null>(null);
  const shakaRef = useRef<shaka.Player | null>(null);
  const uiRef = useRef<shaka.ui.Overlay | null>(null); // Ref for Shaka UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iosWarning, setIosWarning] = useState<string | null>(null);

  // Check for iOS compatibility issues
  const checkIOSCompatibility = useMemo(() => {
    if (!isIOS()) return null;
    
    // MPD streams with ClearKey DRM don't work on iOS
    if (channel.type === 'mpd' && channel.clearKey) {
      return 'Hindi supported ang stream na ito sa iPhone/iPad dahil sa DRM restrictions. Subukan sa Android o desktop browser.';
    }
    
    // Plain MPD might work but ClearKey definitely won't
    if (channel.type === 'mpd') {
      return 'Maaaring hindi gumana ang stream na ito sa iPhone/iPad. Subukan sa Android o desktop browser kung may problema.';
    }
    
    return null;
  }, [channel]);

  // Update parent about online status
  useEffect(() => {
    onStatusChange?.(!error && !iosWarning);
  }, [error, iosWarning, onStatusChange]);
  
  // Set iOS warning on mount
  useEffect(() => {
    if (checkIOSCompatibility) {
      setIosWarning(checkIOSCompatibility);
    }
  }, [checkIOSCompatibility]);

  useEffect(() => {
    let isMounted = true;

    const loadPlayer = async () => {
      if (!videoRef.current || !containerRef.current) return;
      
      setIsLoading(true);
      setError(null);

      // Cleanup previous instances
      if (uiRef.current) {
        await uiRef.current.destroy();
        uiRef.current = null;
      }
      if (shakaRef.current) {
        await shakaRef.current.destroy();
        shakaRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      try {
        // ==========================================
        // HLS LOGIC (using hls.js or native)
        // ==========================================
        if (channel.type === 'hls') {
          // Use native browser controls for HLS since we aren't using Shaka UI for it
          videoRef.current.controls = true; 

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
        } 
        // ==========================================
        // DASH/MPD LOGIC (using Shaka Player + UI)
        // ==========================================
        else if (channel.type === 'mpd') {
          // Disable native controls so Shaka UI can take over
          videoRef.current.controls = false;

          shaka.polyfill.installAll();
          
          if (!shaka.Player.isBrowserSupported()) {
            if (isMounted) {
              setError('Your browser does not support this stream format.');
              setIsLoading(false);
            }
            return;
          }

          // 1. Initialize Player
          const player = new shaka.Player(videoRef.current);
          shakaRef.current = player;

          // 2. Initialize UI Overlay (Gives you the Quality Selector/Gear Icon)
          const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
          uiRef.current = ui;

          // Configure UI buttons
          ui.configure({
            overflowMenuButtons: ['quality', 'captions', 'language', 'picture_in_picture', 'cast'],
            addBigPlayButton: true,
          });

          // Configure DRM
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

            // 3. Subtitle Logic (Auto-enable English)
            const textTracks = player.getTextTracks();
            const englishTrack = textTracks.find((track: any) => 
                track.language === 'en' || track.language === 'eng'
            );

            if (englishTrack) {
                player.setTextTrackVisibility(true); // Turn on captions
                player.selectTextTrack(englishTrack); // Select English
                console.log('Subtitles auto-enabled:', englishTrack.language);
            }

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
      
      if (uiRef.current) {
        uiRef.current.destroy();
        uiRef.current = null;
      }
      
      if (shakaRef.current) {
        shakaRef.current.destroy().catch(() => {});
        shakaRef.current = null;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  return (
    <>
      {isLoading && !iosWarning && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10 pointer-events-none">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {iosWarning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center z-20">
          <Smartphone className="w-12 h-12 text-amber-500" />
          <p className="text-amber-500 font-medium">iOS Compatibility Issue</p>
          <p className="text-muted-foreground text-sm max-w-xs">{iosWarning}</p>
        </div>
      )}

      {error && !iosWarning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center z-20">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Container for Shaka UI Overlay */}
      <div 
        ref={containerRef} 
        className="relative w-full h-full"
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          autoPlay
          playsInline
          // Note: 'controls' is handled dynamically in the useEffect above
        />
      </div>
    </>
  );
};

export const LivePlayer = ({ channel, onStatusChange }: LivePlayerProps) => {
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
      <PlayerCore 
        key={channel.id} 
        channel={channel} 
        onStatusChange={onStatusChange}
      />
    </div>
  );
};
