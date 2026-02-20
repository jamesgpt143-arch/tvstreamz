import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone, Settings, Check, Shield } from 'lucide-react';
import Hls from 'hls.js';
// IMPORTANT: Import Shaka Player UI with CSS for styled controls
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import { supabase } from '@/integrations/supabase/client';

// Proxy failure memory - remembers which proxies failed and skips them for 1 hour
const PROXY_FAIL_PREFIX = 'proxy_fail_';
const PROXY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const markProxyFailed = (proxyUrl: string) => {
  if (!proxyUrl) return;
  try {
    localStorage.setItem(PROXY_FAIL_PREFIX + btoa(proxyUrl), Date.now().toString());
  } catch {}
};

const isProxyCoolingDown = (proxyUrl: string): boolean => {
  if (!proxyUrl) return false;
  try {
    const failedAt = localStorage.getItem(PROXY_FAIL_PREFIX + btoa(proxyUrl));
    if (!failedAt) return false;
    if (Date.now() - parseInt(failedAt) > PROXY_COOLDOWN_MS) {
      localStorage.removeItem(PROXY_FAIL_PREFIX + btoa(proxyUrl));
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Get the Cloudflare proxy URLs (primary + backup1 + backup2) + Cloud edge function proxy
const getProxyUrls = async (): Promise<{ primary: string; backup: string; backup2: string; cloud: string }> => {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'iptv_config')
      .single();
    const config = data?.value as Record<string, string> | null;
    
    // Build Cloud proxy URL from env
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
    const cloudProxyUrl = projectId ? `https://${projectId}.supabase.co/functions/v1/hls-proxy` : '';
    
    return {
      primary: config?.cloudflare_proxy_url || '',
      backup: config?.cloudflare_proxy_url_backup || '',
      backup2: config?.cloudflare_proxy_url_backup2 || '',
      cloud: cloudProxyUrl,
    };
  } catch {
    return { primary: '', backup: '', backup2: '', cloud: '' };
  }
};

// Pick the best available proxy (skipping those in cooldown)
const pickBestProxy = (urls: { primary: string; backup: string; backup2: string; cloud: string }): string[] => {
  const ordered = [urls.primary, urls.backup, urls.backup2, urls.cloud].filter(Boolean);
  const available: string[] = [];
  const coolingDown: string[] = [];
  
  for (const url of ordered) {
    if (isProxyCoolingDown(url)) {
      coolingDown.push(url);
    } else {
      available.push(url);
    }
  }
  
  // Put cooling-down proxies at the end as last resort
  return [...available, ...coolingDown];
};

// Build proxied manifest URL with custom user-agent and referrer
const buildProxiedUrl = (proxyBase: string, manifestUrl: string, userAgent?: string, referrer?: string): string => {
  const url = new URL(proxyBase);
  url.searchParams.set('url', manifestUrl);
  if (userAgent) {
    url.searchParams.set('ua', userAgent);
  }
  if (referrer) {
    url.searchParams.set('referer', referrer);
  }
  return url.toString();
};

// Detect iOS devices
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

interface LivePlayerProps {
  channel: Channel;
  onStatusChange?: (isOnline: boolean) => void;
  onProxyChange?: (label: string) => void;
}

// Inner component that handles the actual player
const PlayerCore = ({ channel, onStatusChange, onProxyChange }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the UI container
  const hlsRef = useRef<Hls | null>(null);
  const shakaRef = useRef<shaka.Player | null>(null);
  const uiRef = useRef<shaka.ui.Overlay | null>(null); // Ref for Shaka UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iosWarning, setIosWarning] = useState<string | null>(null);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const proxyLabelMapRef = useRef<Map<string, string>>(new Map());

  // Check for iOS compatibility issues
  const checkIOSCompatibility = useMemo(() => {
    if (!isIOS()) return null;
    
    // DRM streams don't work on iOS
    if (channel.clearKey || channel.widevineUrl) {
      return 'Hindi supported ang stream na ito sa iPhone/iPad dahil sa DRM restrictions. Subukan sa Android o desktop browser.';
    }
    
    // Plain MPD might work but could have issues
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

  const handleQualityChange = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
    setShowQualityMenu(false);
  }, []);

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
        // Get proxy URLs only if channel has proxy enabled
        const proxyUrls = channel.useProxy ? await getProxyUrls() : { primary: '', backup: '', backup2: '', cloud: '' };
        const orderedProxies = channel.useProxy ? pickBestProxy(proxyUrls) : [];
        const proxyUrl = orderedProxies[0] || '';
        const streamUrl = channel.manifestUri;

        // Build label map for proxy indicator
        const labelMap = new Map<string, string>();
        if (proxyUrls.primary) labelMap.set(proxyUrls.primary, 'Primary');
        if (proxyUrls.backup) labelMap.set(proxyUrls.backup, 'Backup 1');
        if (proxyUrls.backup2) labelMap.set(proxyUrls.backup2, 'Backup 2');
        if (proxyUrls.cloud) labelMap.set(proxyUrls.cloud, 'Cloud');
        proxyLabelMapRef.current = labelMap;

        // Set initial active proxy label
        if (proxyUrl && isMounted) {
          onProxyChange?.(labelMap.get(proxyUrl) || 'Direct');
        } else if (!channel.useProxy && isMounted) {
          onProxyChange?.('Direct');
        }

        // Helper: configure Shaka request filter to proxy all requests
        const configureShakaProxy = (player: shaka.Player, activeProxyUrl: string) => {
          if (!activeProxyUrl) return;
          const netEngine = player.getNetworkingEngine();
          if (!netEngine) return;
          
          // Clear any existing request filters before adding a new one
          netEngine.clearAllRequestFilters();
          
          // Get the base URL of the original manifest for resolving relative paths
          const manifestBase = channel.manifestUri.substring(0, channel.manifestUri.lastIndexOf('/') + 1);
          const proxyOrigin = new URL(activeProxyUrl).origin;
          // Get the full proxy path prefix (e.g., "/functions/v1/hls-proxy" for Cloud)
          const proxyPathname = new URL(activeProxyUrl).pathname;
          
          netEngine.registerRequestFilter((type: any, request: any) => {
            const url = request.uris[0];
            if (!url) return;
            
            // Skip non-HTTP URLs (data:, blob:, etc.) and already-proxied URLs
            if (!url.startsWith('http')) return;
            if (url.includes('?url=') || url.includes('&url=')) return;
            
            // If URL starts with proxy origin but missing ?url= param,
            // it's a relative URL resolved against the proxy — reconstruct original
            if (url.startsWith(proxyOrigin)) {
              const path = url.substring(proxyOrigin.length);
              // Strip the proxy's own path prefix (e.g., /functions/v1/hls-proxy or /)
              let relativePath = path;
              if (proxyPathname !== '/' && relativePath.startsWith(proxyPathname)) {
                relativePath = relativePath.substring(proxyPathname.length);
              }
              // Remove leading slash
              relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
              const fullOriginalUrl = manifestBase + relativePath;
              request.uris[0] = buildProxiedUrl(activeProxyUrl, fullOriginalUrl, channel.userAgent, channel.referrer);
              return;
            }
            
            // External URL — proxy it
            request.uris[0] = buildProxiedUrl(activeProxyUrl, url, channel.userAgent, channel.referrer);
          });
          console.log('Shaka proxy filter configured');
        };

        // ==========================================
        // HLS LOGIC - Check if DRM is needed
        // ==========================================
        if (channel.type === 'hls') {
          // If HLS has Widevine DRM, use Shaka Player
          if (channel.widevineUrl) {
            videoRef.current.controls = false;

            shaka.polyfill.installAll();
            
            if (!shaka.Player.isBrowserSupported()) {
              if (isMounted) {
                setError('Your browser does not support this stream format.');
                setIsLoading(false);
              }
              return;
            }

            const player = new shaka.Player(/* mediaElement= */ null, containerRef.current);
            await player.attach(videoRef.current);
            shakaRef.current = player;

            const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
            uiRef.current = ui;

            ui.configure({
              overflowMenuButtons: ['quality', 'captions', 'language', 'picture_in_picture', 'cast'],
              addBigPlayButton: true,
            });

            player.configure({
              drm: {
                servers: { 'com.widevine.alpha': channel.widevineUrl },
              },
              abr: {
                enabled: true,
                defaultBandwidthEstimate: 1500000,
              },
              preferredTextLanguage: 'en',
              streaming: {
                alwaysStreamText: true,
              },
            });

            configureShakaProxy(player, proxyUrl);

            try {
              await player.load(streamUrl);

              // Auto-enable English subtitles
              const textTracks = player.getTextTracks();
              const englishTrack = textTracks.find((track: any) => 
                  track.language === 'en' || track.language === 'eng'
              );
              if (englishTrack) {
                  player.setTextTrackVisibility(true);
                  player.selectTextTrack(englishTrack);
                  console.log('HLS+Widevine subtitles auto-enabled:', englishTrack.language);
              }

              if (isMounted) {
                setIsLoading(false);
                videoRef.current?.play().catch(() => {});
              }
            } catch (err) {
              console.error('Shaka error:', err);
              if (isMounted) {
                setError('Failed to load stream. The channel may be offline or requires CORS headers from the server.');
                setIsLoading(false);
              }
            }
          } else {
            // Standard HLS without DRM - use hls.js or native
            videoRef.current.controls = true; 

            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                startLevel: -1, // Auto-select best quality
                capLevelToPlayerSize: true, // Don't load higher than display size
                abrEwmaDefaultEstimate: 1500000, // Start assuming decent bandwidth
                abrBandWidthUpFactor: 0.7, // Switch up to HD quickly
                abrBandWidthFactor: 0.8, // Switch down less aggressively
              });
              hlsRef.current = hls;
              
              hls.loadSource(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
              hls.attachMedia(videoRef.current);
              
              hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                if (isMounted) {
                  setIsLoading(false);
                  // Extract available quality levels
                  const levels = hls.levels
                    .map((level, index) => ({ height: level.height, index }))
                    .filter(l => l.height > 0)
                    .sort((a, b) => b.height - a.height);
                  // Remove duplicates
                  const unique = levels.filter((l, i, arr) => i === 0 || l.height !== arr[i - 1].height);
                  setHlsLevels(unique);
                  setCurrentLevel(-1);
                  videoRef.current?.play().catch(() => {});
                }
              });

              hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                if (isMounted && hlsRef.current && hlsRef.current.currentLevel === -1) {
                  // keep showing "Auto" when ABR is active
                }
              });
              
              // Track which proxy index we're on for failover
              let currentProxyIndex = 0;
              
              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal && isMounted) {
                  // Mark current proxy as failed
                  if (orderedProxies[currentProxyIndex]) {
                    markProxyFailed(orderedProxies[currentProxyIndex]);
                    console.log(`Proxy failed, marked for 1hr cooldown: ${orderedProxies[currentProxyIndex]}`);
                  }
                  
                  // Try next proxy in the ordered list
                  currentProxyIndex++;
                  if (currentProxyIndex < orderedProxies.length) {
                    const nextProxy = orderedProxies[currentProxyIndex];
                    console.log(`Switching to next proxy (${currentProxyIndex + 1}/${orderedProxies.length}): ${nextProxy}`);
                    onProxyChange?.(proxyLabelMapRef.current.get(nextProxy) || `Proxy ${currentProxyIndex + 1}`);
                    hls.loadSource(buildProxiedUrl(nextProxy, streamUrl, channel.userAgent, channel.referrer));
                    return;
                  }
                  
                  setError('Failed to load stream. The channel may be offline.');
                  setIsLoading(false);
                }
              });
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
              // Native HLS support (Safari)
              videoRef.current.src = proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl;
              const handleLoaded = () => {
                if (isMounted) {
                  setIsLoading(false);
                  videoRef.current?.play().catch(() => {});
                }
              };
              videoRef.current.addEventListener('loadedmetadata', handleLoaded);
            }
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
          const player = new shaka.Player(/* mediaElement= */ null, containerRef.current);
          await player.attach(videoRef.current);
          shakaRef.current = player;

          // 2. Initialize UI Overlay (Gives you the Quality Selector/Gear Icon)
          const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
          uiRef.current = ui;

          // Configure UI buttons
          ui.configure({
            overflowMenuButtons: ['quality', 'captions', 'language', 'picture_in_picture', 'cast'],
            addBigPlayButton: true,
          });

          // Configure DRM + text preferences
          player.configure({
            drm: {
              clearKeys: channel.clearKey || {},
              servers: channel.widevineUrl
                ? { 'com.widevine.alpha': channel.widevineUrl }
                : {},
            },
            abr: {
              enabled: true,
              defaultBandwidthEstimate: 1500000,
            },
            preferredTextLanguage: 'en',
            streaming: {
              alwaysStreamText: true,
            },
          });

          configureShakaProxy(player, proxyUrl);

          try {
            await player.load(streamUrl);

            // 3. Subtitle Logic (Auto-enable English)
            const textTracks = player.getTextTracks();
            console.log('Available text tracks:', JSON.stringify(textTracks.map((t: any) => ({ lang: t.language, kind: t.kind, label: t.label, roles: t.roles }))));
            const englishTrack = textTracks.find((track: any) => 
                track.language === 'en' || track.language === 'eng'
            );

            if (englishTrack) {
                player.selectTextTrack(englishTrack); // Select English first
                player.setTextTrackVisibility(true); // Then turn on visibility
                console.log('Subtitles auto-enabled:', englishTrack.language);
            } else {
                console.log('No English text track found. Available languages:', textTracks.map((t: any) => t.language));
                // If any text track exists, enable the first one
                if (textTracks.length > 0) {
                  player.selectTextTrack(textTracks[0]);
                  player.setTextTrackVisibility(true);
                  console.log('Enabled first available track:', textTracks[0].language);
                }
            }

            if (isMounted) {
              setIsLoading(false);
              videoRef.current?.play().catch(() => {});
            }
          } catch (err) {
            console.error('Shaka error:', err);
            // Try remaining proxies as fallback for DASH
            let dashRecovered = false;
            for (let i = 1; i < orderedProxies.length; i++) {
              const fallbackProxy = orderedProxies[i];
              console.log(`DASH: proxy failed, trying fallback ${i + 1}/${orderedProxies.length}: ${fallbackProxy}`);
              markProxyFailed(orderedProxies[i - 1]);
              configureShakaProxy(player, fallbackProxy);
              try {
                await player.load(streamUrl);

                // Auto-enable English subtitles on retry
                const retryTextTracks = player.getTextTracks();
                const retryEnglishTrack = retryTextTracks.find((track: any) => 
                    track.language === 'en' || track.language === 'eng'
                );
                if (retryEnglishTrack) {
                    player.setTextTrackVisibility(true);
                    player.selectTextTrack(retryEnglishTrack);
                }

                if (isMounted) {
                  setIsLoading(false);
                  onProxyChange?.(proxyLabelMapRef.current.get(fallbackProxy) || `Proxy ${i + 1}`);
                  videoRef.current?.play().catch(() => {});
                }
                dashRecovered = true;
                break;
              } catch (retryErr) {
                console.error(`Fallback proxy ${i + 1} also failed:`, retryErr);
                markProxyFailed(fallbackProxy);
              }
            }
            if (!dashRecovered && isMounted) {
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

        {/* HLS Quality Selector - TV Remote & D-pad friendly */}
        {hlsLevels.length > 1 && hlsRef.current && (
          <div className="absolute top-2 right-2 z-30">
            <button
              onClick={() => setShowQualityMenu(prev => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowQualityMenu(prev => !prev);
                }
              }}
              className="bg-background/80 backdrop-blur-sm border-2 border-border rounded-lg p-2 hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              title="Quality"
              aria-label="Change video quality"
            >
              <Settings className="w-6 h-6 text-foreground" />
            </button>
            {showQualityMenu && (
              <div
                className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[140px]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'Backspace') {
                    setShowQualityMenu(false);
                  }
                }}
              >
                <button
                  autoFocus
                  onClick={() => handleQualityChange(-1)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors ${currentLevel === -1 ? 'text-primary font-semibold' : 'text-foreground'}`}
                >
                  {currentLevel === -1 && <Check className="w-4 h-4" />}
                  <span className={currentLevel === -1 ? '' : 'ml-6'}>Auto</span>
                </button>
                {hlsLevels.map((level) => (
                  <button
                    key={level.index}
                    onClick={() => handleQualityChange(level.index)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors ${currentLevel === level.index ? 'text-primary font-semibold' : 'text-foreground'}`}
                  >
                    {currentLevel === level.index && <Check className="w-4 h-4" />}
                    <span className={currentLevel === level.index ? '' : 'ml-6'}>{level.height}p</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export const LivePlayer = ({ channel, onStatusChange }: LivePlayerProps) => {
  const [activeProxyLabel, setActiveProxyLabel] = useState<string | null>(null);

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
    <div>
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border relative">
        <PlayerCore 
          key={channel.id} 
          channel={channel} 
          onStatusChange={onStatusChange}
          onProxyChange={setActiveProxyLabel}
        />
      </div>
      {activeProxyLabel && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Proxy: <span className={`font-medium ${activeProxyLabel === 'Primary' ? 'text-primary' : activeProxyLabel === 'Direct' ? 'text-muted-foreground' : 'text-accent-foreground'}`}>{activeProxyLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
};
