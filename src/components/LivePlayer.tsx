import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Channel, type ProxyKey, DEFAULT_PROXY_ORDER } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone, Settings, Check, Shield, RefreshCw } from 'lucide-react';
import Hls from 'hls.js';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import { supabase } from '@/integrations/supabase/client';
import { setupOrientationFullscreen } from '@/lib/capacitorFullscreen';

const badProxiesCache = new Map<string, number>(); // format: "channelId:proxyUrl" -> timestamp
const PROXY_TIMEOUT_MS = 5 * 60 * 1000; // Reduced to 5 minutes for IPTV sensitivity

const getProxyUrls = async (proxyType: string = 'cloudflare'): Promise<{ primary: string; backup: string; backup2: string; backup3: string; backup4: string; backup5: string; backup6: string }> => {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'iptv_config')
      .single();
    const config = data?.value as Record<string, string> | null;
    const prefix = proxyType === 'supabase' ? 'supabase_proxy_url' : 'cloudflare_proxy_url';
    return {
      primary: config?.[prefix] || '',
      backup: config?.[`${prefix}_backup`] || '',
      backup2: config?.[`${prefix}_backup2`] || '',
      backup3: config?.[`${prefix}_backup3`] || '',
      backup4: config?.[`${prefix}_backup4`] || '',
      backup5: config?.[`${prefix}_backup5`] || '',
      backup6: config?.[`${prefix}_backup6`] || '',
    };
  } catch {
    return { primary: '', backup: '', backup2: '', backup3: '', backup4: '', backup5: '', backup6: '' };
  }
};

const pickBestProxy = (
  urls: { primary: string; backup: string; backup2: string; backup3: string; backup4: string; backup5: string; backup6: string },
  channelProxyOrder?: ProxyKey[]
): string[] => {
  const order = channelProxyOrder || DEFAULT_PROXY_ORDER;
  const urlMap: Record<ProxyKey, string> = {
    primary: urls.primary,
    backup: urls.backup,
    backup2: urls.backup2,
    backup3: urls.backup3,
    backup4: urls.backup4,
    backup5: urls.backup5,
    backup6: urls.backup6,
  };
  return order.map(k => urlMap[k]).filter(Boolean);
};

const buildProxiedUrl = (proxyBase: string, manifestUrl: string, userAgent?: string, referrer?: string): string => {
  const url = new URL(proxyBase);
  url.searchParams.set('url', manifestUrl);
  if (userAgent) url.searchParams.set('ua', userAgent);
  if (referrer) url.searchParams.set('referer', referrer);
  return url.toString();
};

const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const getProxiedLogoUrl = (logo?: string, proxyBase?: string) => {
  if (!logo) return '';
  if (logo.startsWith('https://')) return logo;
  if (!proxyBase) return logo; // Fallback to original if no proxy available
  
  try {
    const url = new URL(proxyBase);
    url.searchParams.set('url', logo);
    return url.toString();
  } catch {
    return logo;
  }
};

interface LivePlayerProps {
  channel: Channel;
  onStatusChange?: (isOnline: boolean) => void;
  onProxyChange?: (label: string) => void;
}

const PlayerCore = ({ channel, onStatusChange, onProxyChange }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
    const shakaRef = useRef<shaka.Player | null>(null);
    const uiRef = useRef<shaka.ui.Overlay | null>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    
    const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iosWarning, setIosWarning] = useState<string | null>(null);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const proxyLabelMapRef = useRef<Map<string, string>>(new Map());
  const shakaLoadingRef = useRef<boolean>(false);
  const currentBestProxyRef = useRef<string>('');

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [offlineText, setOfflineText] = useState({
    title: "Channel is currently offline.",
    message: "Please try another channel or use a backup link."
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchOfflineText = async () => {
      if (channel.offlineTitle || channel.offlineMessage) {
        if (isMounted) {
          setOfflineText({
            title: channel.offlineTitle || "Channel is currently offline.",
            message: channel.offlineMessage || "Please try another channel or use a backup link."
          });
        }
      } 
      else {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'iptv_config').maybeSingle();
        if (isMounted && data?.value) {
          const conf = data.value as any;
          setOfflineText({
            title: conf.offline_title || "Channel is currently offline.",
            message: conf.offline_message || "Please try another channel or use a backup link."
          });
        }
      }
    };

    fetchOfflineText();

    return () => { isMounted = false; };
  }, [channel.offlineTitle, channel.offlineMessage]);

  useEffect(() => {
    setReloadTrigger(0);
    setIsRefreshing(false);
  }, [channel.id]);

  useEffect(() => {
    return setupOrientationFullscreen(containerRef.current, !error && !iosWarning);
  }, [error, iosWarning]);

  const checkIOSCompatibility = useMemo(() => {
    if (!isIOS()) return null;
    if (channel.clearKey || channel.widevineUrl) return 'Hindi supported ang stream na ito sa iPhone/iPad dahil sa DRM restrictions.';
    if (channel.type === 'mpd') return 'Maaaring hindi gumana ang stream na ito sa iPhone/iPad.';
    return null;
  }, [channel]);

  useEffect(() => {
    onStatusChange?.(!error && !iosWarning);
  }, [error, iosWarning, onStatusChange]);
  
  useEffect(() => {
    if (checkIOSCompatibility) setIosWarning(checkIOSCompatibility);
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
      
      if (shakaLoadingRef.current) return;
      shakaLoadingRef.current = true;
      
      setIsLoading(true);
      setError(null);
      if (reloadTrigger > 0) setIsRefreshing(true);

      try {
        if (uiRef.current) { 
          const oldUi = uiRef.current;
          uiRef.current = null;
          await oldUi.destroy(); 
        }
        if (shakaRef.current) { 
          const oldPlayer = shakaRef.current;
          shakaRef.current = null;
          await oldPlayer.destroy(); 
        }
        if (hlsRef.current) { 
          const oldHls = hlsRef.current;
          hlsRef.current = null;
          oldHls.destroy(); 
        }
      } catch (e) {
        console.warn('Error destroying old player instances', e);
      }

      try {
        // Universal Auto-Detect Logic
        let streamUrl = channel.manifestUri;
        
        // 1. Resolve TVApp Slugs if needed
        if (channel.tvappSlug) {
          try {
            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            let resolveUrl = `https://${projectId}.supabase.co/functions/v1/tvapp-resolver?slug=${encodeURIComponent(channel.tvappSlug)}`;
            if (reloadTrigger > 0) resolveUrl += `&force_refresh=true`;

            const res = await fetch(resolveUrl);
            if (res.ok) {
              const data = await res.json();
              if (data.resolved_url) streamUrl = data.resolved_url;
            }
          } catch (e) {
            console.warn('[TVApp] Failed to resolve slug', e);
          }
        }

        const defaultUA = "Dalvik/2.1.0 (Linux; U; Android 12; Pixel 6 Build/SD1A.210817.036)";
        const targetUA = channel.userAgent || defaultUA;

        // 2. Gather All Potential Proxies (Respect Admin Settings)
        const isStrict = channel.proxyType && channel.proxyType !== 'none';
        const isAuto = !isStrict && channel.useProxy;
        
        let cfProxies = {};
        let sbProxies = {};

        if (isStrict) {
          if (channel.proxyType === 'cloudflare') {
            cfProxies = await getProxyUrls('cloudflare').catch(() => ({}));
          } else if (channel.proxyType === 'supabase') {
            sbProxies = await getProxyUrls('supabase').catch(() => ({}));
          }
        } else if (isAuto) {
          // Universal Auto-Detect (M3U or No Strict Provider)
          const [cf, sb] = await Promise.all([
            getProxyUrls('cloudflare').catch(() => ({})),
            getProxyUrls('supabase').catch(() => ({}))
          ]);
          cfProxies = cf;
          sbProxies = sb;
        }

        // Deduplicate and Order Candidates
        let providerProxies: string[] = [];
        const combinedMap = { ...cfProxies, ...sbProxies } as Record<string, string>;
        
        if (isStrict && channel.proxyOrder && channel.proxyOrder.length > 0) {
          // Strictly follow admin's priority order
          providerProxies = channel.proxyOrder
            .map(key => combinedMap[key])
            .filter(p => p && typeof p === 'string');
        } else {
          providerProxies = Array.from(new Set([
            ...Object.values(cfProxies),
            ...Object.values(sbProxies)
          ].filter(p => p && typeof p === 'string'))) as string[];
        }

        const labelMap = new Map<string, string>();
        labelMap.set('direct', 'Direct');
        
        providerProxies.forEach((p, idx) => {
          if (Object.values(cfProxies).includes(p)) {
            // Find key in cfProxies if possible for better label, else generic
            const key = Object.keys(cfProxies).find(k => (cfProxies as any)[k] === p);
            labelMap.set(p, key === 'main' ? 'Main Proxy' : (key ? `CF-${key}` : `Backup ${idx}`));
          } else {
            const key = Object.keys(sbProxies).find(k => (sbProxies as any)[k] === p);
            labelMap.set(p, key === 'main' ? 'Supabase' : (key ? `SB-${key}` : `Worker ${idx}`));
          }
        });
        proxyLabelMapRef.current = labelMap;

        // 3. The Universal Race
        if (isMounted) onProxyChange?.(isStrict ? `Using ${channel.proxyType}...` : 'Detecting best connection...');

        let activeProxyUrl = '';
        
        const testConnection = (proxy: string | null) => {
          return new Promise<string>(async (resolve, reject) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
              const testUrl = proxy === 'direct' 
                ? streamUrl 
                : buildProxiedUrl(proxy!, streamUrl, targetUA, channel.referrer);
              
              const res = await fetch(testUrl, { 
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
              });
              clearTimeout(timeoutId);
              
              if (res.ok || res.status === 402) {
                resolve(proxy!);
              } else {
                if (proxy !== 'direct' && (res.status === 429 || res.status === 403 || res.status >= 500)) {
                  badProxiesCache.set(`${channel.id}:${proxy!}`, Date.now());
                }
                reject(new Error(`Status ${res.status}`));
              }
            } catch (err) {
              clearTimeout(timeoutId);
              if (proxy !== 'direct' && proxy) badProxiesCache.set(`${channel.id}:${proxy}`, Date.now());
              reject(err);
            }
          });
        };

        const candidates: string[] = [];
        const isPageHttps = window.location.protocol === 'https:';
        const isStreamHttp = streamUrl.startsWith('http:');
        const needsProxyForMixedContent = isPageHttps && isStreamHttp;

        // Direct only allowed if NOT strictly using a provider, UNLESS it's the ONLY option
        if (!needsProxyForMixedContent && !isStrict) {
          candidates.push('direct');
        }

        candidates.push(...providerProxies.filter(p => {
          const cacheKey = `${channel.id}:${p}`;
          if (badProxiesCache.has(cacheKey)) {
            if (Date.now() - badProxiesCache.get(cacheKey)! < PROXY_TIMEOUT_MS) return false;
            badProxiesCache.delete(cacheKey);
          }
          return true;
        }));
        
        if (candidates.length === 0 && needsProxyForMixedContent) {
          setError("This channel requires HTTPS but only provides HTTP. No proxy is available.");
          setIsLoading(false);
          return;
        }

        // 4. Selection (Strict vs Auto)
        try {
          if (isStrict) {
            // Strictly and immediately use the first candidate (already prioritized by admin)
            activeProxyUrl = candidates[0] || '';
            if (activeProxyUrl === 'direct') activeProxyUrl = '';
            
            if (isMounted) onProxyChange?.(labelMap.get(activeProxyUrl || 'direct') || 'Connected');
          } else if (isAuto) {
            // Auto-detect mode (M3U or Smart Proxy enabled)
            const supabaseProxies = Object.values(sbProxies);
            const racePromises = candidates.map(c => {
              // Apply a 2000ms (2s) delay to Supabase proxies to strongly prioritize Cloudflare/Direct in auto mode
              if (supabaseProxies.includes(c)) {
                return new Promise(resolve => setTimeout(resolve, 2000)).then(() => testConnection(c));
              }
              return testConnection(c);
            });

            activeProxyUrl = await (Promise as any).any(racePromises);
            if (isMounted) onProxyChange?.(labelMap.get(activeProxyUrl) || 'Connected');
            
            if (activeProxyUrl === 'direct') {
              activeProxyUrl = ''; // Player expects empty for direct
            }
          } else {
            // Direct mode
            activeProxyUrl = '';
            if (isMounted) onProxyChange?.('Direct');
          }
        } catch (err) {
          console.warn('[Connection] Failed to select proxy. Using fallback.');
          activeProxyUrl = ''; 
          if (isMounted) onProxyChange?.('Fallback');
        }

        currentBestProxyRef.current = activeProxyUrl || combinedMap.primary || '';

        const proxyUrl = activeProxyUrl;
        const currentUA = targetUA;

        // SHARED SHAKA PROXY CONFIG (Ginagamit ng MPD at HLS-Widevine)
        const configureShakaProxy = (player: shaka.Player, proxyToUse: string) => {
          if (!proxyToUse) return;
          const netEngine = player.getNetworkingEngine();
          if (!netEngine) return;
          
          netEngine.clearAllRequestFilters();
          const manifestBase = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
          const proxyOrigin = new URL(proxyToUse).origin;
          const proxyPathname = new URL(proxyToUse).pathname;
          
          netEngine.registerRequestFilter((type: any, request: any) => {
            // FIX PARA SA INCOGNITO: Iwasan ang pag-block ng third-party cookies
            request.allowCrossSiteCredentials = false;

            const url = request.uris[0];
            if (!url) return;
            if (!url.startsWith('http')) return;
            if (url.includes('?url=') || url.includes('&url=')) return;
            
            if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
              request.uris[0] = buildProxiedUrl(proxyToUse, url, targetUA, channel.referrer);
              return;
            }

            if (url.startsWith(proxyOrigin)) {
              const path = url.substring(proxyOrigin.length);
              let relativePath = path;
              if (proxyPathname !== '/' && relativePath.startsWith(proxyPathname)) {
                relativePath = relativePath.substring(proxyPathname.length);
              }
              relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
              const fullOriginalUrl = manifestBase + relativePath;
              request.uris[0] = buildProxiedUrl(proxyToUse, fullOriginalUrl, channel.userAgent, channel.referrer);
              return;
            }
            request.uris[0] = buildProxiedUrl(proxyToUse, url, targetUA, channel.referrer);
          });
        };

        const triggerAutoRefresh = () => {
          if (channel.tvappSlug && reloadTrigger < 2) { 
            if (isMounted) setReloadTrigger(prev => prev + 1);
            return true;
          }
          return false;
        };

        if (channel.type === 'hls') {
          if (channel.widevineUrl) {
            videoRef.current.controls = false;
            shaka.polyfill.installAll();
            
            if (!shaka.Player.isBrowserSupported()) {
              if (isMounted) { setError('Browser unsupported.'); setIsLoading(false); setIsRefreshing(false); }
              return;
            }

            const player = new shaka.Player(/* mediaElement= */ null, containerRef.current);
            await player.attach(videoRef.current);
            shakaRef.current = player;
            const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
            uiRef.current = ui;
            
            player.configure({ 
              preferredAudioLanguage: 'en',
              drm: { servers: { 'com.widevine.alpha': channel.widevineUrl } }, 
              abr: { enabled: true },
              offline: { usePersistentLicense: false } // FIX PARA SA INCOGNITO (HLS DRM)
            });
            ui.configure({ overflowMenuButtons: ['quality', 'language', 'captions', 'picture_in_picture', 'cast'], addBigPlayButton: true });
            
            configureShakaProxy(player, proxyUrl);

            try {
              await player.load(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
              if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
            } catch (err) {
              if (isMounted) {
                if (!triggerAutoRefresh()) {
                  setError('Failed to load stream.');
                  setIsLoading(false);
                  setIsRefreshing(false);
                }
              }
            }
          } else {
            videoRef.current.controls = true; 
            if (Hls.isSupported()) {
              const hls = new Hls({ 
                enableWorker: true, 
                lowLatencyMode: true, 
                startLevel: -1,
                xhrSetup: (xhr, url) => {
                  if (proxyUrl) {
                    const proxyOrigin = new URL(proxyUrl).origin;
                    if (url.includes('?url=') || url.includes('&url=')) return;

                    if (url.startsWith(proxyOrigin)) {
                       const proxyPathname = new URL(proxyUrl).pathname;
                       const path = url.substring(proxyOrigin.length);
                       let relativePath = path;
                       if (proxyPathname !== '/' && relativePath.startsWith(proxyPathname)) {
                         relativePath = relativePath.substring(proxyPathname.length);
                       }
                       relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
                       const manifestBase = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
                       const fullOriginalUrl = manifestBase + relativePath;
                       xhr.open('GET', buildProxiedUrl(proxyUrl, fullOriginalUrl, targetUA, channel.referrer), true);
                    } else if (url.startsWith('http')) {
                       xhr.open('GET', buildProxiedUrl(proxyUrl, url, targetUA, channel.referrer), true);
                    }
                  }
                }
              });
              hlsRef.current = hls;
              hls.loadSource(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
              hls.attachMedia(videoRef.current);
              
              hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                if (isMounted) {
                  setIsLoading(false);
                  setIsRefreshing(false);
                  const levels = hls.levels.map((l, i) => ({ height: l.height, index: i })).filter(l => l.height > 0).sort((a, b) => b.height - a.height);
                  setHlsLevels(levels.filter((l, i, arr) => i === 0 || l.height !== arr[i - 1].height));
                  videoRef.current?.play().catch(() => {});
                }
              });
              
              let currentProxyIndex = candidates.indexOf(proxyUrl || 'direct');
              if (currentProxyIndex === -1) currentProxyIndex = 0;

              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal && isMounted) {
                  currentProxyIndex++;
                  if (currentProxyIndex < candidates.length) {
                    const nextProxy = candidates[currentProxyIndex];
                    onProxyChange?.(proxyLabelMapRef.current.get(nextProxy) || `Proxy ${currentProxyIndex + 1}`);
                    hls.loadSource(buildProxiedUrl(nextProxy === 'direct' ? '' : nextProxy, streamUrl, channel.userAgent, channel.referrer));
                    return;
                  }
                  
                  if (!triggerAutoRefresh()) {
                    setError('Channel is currently offline.');
                    setIsLoading(false);
                    setIsRefreshing(false);
                  }
                }
              });
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
              videoRef.current.src = proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl;
              videoRef.current.addEventListener('loadedmetadata', () => {
                if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
              });
            }
          }
        }
        else if (channel.type === 'mpd') {
          videoRef.current.controls = false;
          shaka.polyfill.installAll();
          
          if (!shaka.Player.isBrowserSupported()) {
            if (isMounted) { setError('Browser unsupported.'); setIsLoading(false); setIsRefreshing(false); }
            return;
          }

          const player = new shaka.Player(/* mediaElement= */ null, containerRef.current);
          await player.attach(videoRef.current);
          shakaRef.current = player;
          const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
          uiRef.current = ui;
          
          player.configure({ 
            preferredAudioLanguage: 'en',
            drm: { clearKeys: channel.clearKey || {}, servers: channel.widevineUrl ? { 'com.widevine.alpha': channel.widevineUrl } : {} },
            offline: { usePersistentLicense: false } // FIX PARA SA INCOGNITO (MPD)
          });
          ui.configure({ overflowMenuButtons: ['quality', 'language', 'captions', 'picture_in_picture', 'cast'], addBigPlayButton: true });
          
          configureShakaProxy(player, proxyUrl);

          try {
            await player.load(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
            if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
          } catch (err) {
            let dashRecovered = false;
            let startIndex = candidates.indexOf(proxyUrl || 'direct');
            if (startIndex === -1) startIndex = 0;

            for (let i = startIndex + 1; i < candidates.length; i++) {
              const fallbackProxy = candidates[i];
              const finalFallback = fallbackProxy === 'direct' ? '' : fallbackProxy;
              configureShakaProxy(player, finalFallback);
              try {
                await player.load(finalFallback ? buildProxiedUrl(finalFallback, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
                if (isMounted) { setIsLoading(false); setIsRefreshing(false); onProxyChange?.(proxyLabelMapRef.current.get(fallbackProxy) || `Proxy ${i + 1}`); videoRef.current?.play().catch(() => {}); }
                dashRecovered = true;
                break;
              } catch (retryErr) {}
            }
            if (!dashRecovered && isMounted) {
              if (!triggerAutoRefresh()) {
                setError('Channel is currently offline.');
                setIsLoading(false);
                setIsRefreshing(false);
              }
            }
          }
        }
        else if (channel.type === 'plain') {
          if (videoRef.current) {
            videoRef.current.controls = true;
            const finalUrl = proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl;
            videoRef.current.src = finalUrl;
            videoRef.current.addEventListener('loadedmetadata', () => {
              if (isMounted) {
                setIsLoading(false);
                setIsRefreshing(false);
                videoRef.current?.play().catch(() => {});
              }
            });
            videoRef.current.addEventListener('error', () => {
              if (isMounted) {
                setError('Failed to load direct stream.');
                setIsLoading(false);
                setIsRefreshing(false);
              }
            });
          }
        }
      } catch (err) {
        if (isMounted) { setError('Failed to initialize player.'); setIsLoading(false); setIsRefreshing(false); }
      }
    };

    loadPlayer().finally(() => {
      shakaLoadingRef.current = false;
    });

    return () => {
      isMounted = false;
    };
  }, [channel, reloadTrigger]);

  return (
    <>
      {isLoading && !iosWarning && !isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10 pointer-events-none">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {isRefreshing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm z-20">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-primary font-medium">Auto-refreshing stream...</p>
          <p className="text-xs text-muted-foreground mt-1">Getting fresh token</p>
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
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/offline-bars.png')" }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive drop-shadow-md" />
            <p className="text-white font-medium drop-shadow-md bg-black/50 px-4 py-2 rounded-lg border border-white/10">
              {offlineText.title}
            </p>
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{offlineText.message}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full bg-black">
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls />
        {/* Shaka UI elements will be injected here if used */}
      </div>
    </>
  );
};

export const LivePlayer = ({ channel, onStatusChange }: LivePlayerProps) => {
  const [activeProxyLabel, setActiveProxyLabel] = useState<string | null>(null);

  if (channel.type === 'youtube') {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border">
        <iframe src={`${channel.embedUrl}&autoplay=1`} title={channel.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative">
      <PlayerCore key={channel.id} channel={channel} onStatusChange={onStatusChange} onProxyChange={setActiveProxyLabel} />
    </div>
  );
};
