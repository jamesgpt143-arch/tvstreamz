import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Channel, type ProxyKey, DEFAULT_PROXY_ORDER } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone, Settings, Check, Shield, RefreshCw } from 'lucide-react';
import Hls from 'hls.js';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import { supabase } from '@/integrations/supabase/client';

const badProxiesCache = new Map<string, number>();
const PROXY_TIMEOUT_MS = 10 * 60 * 1000;

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
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iosWarning, setIosWarning] = useState<string | null>(null);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const proxyLabelMapRef = useRef<Map<string, string>>(new Map());

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // OFFLINE TEXT STATE
  const [offlineText, setOfflineText] = useState({
    title: "Channel is currently offline.",
    message: "Please try another channel or use a backup link."
  });

  // LOGIC PARA SA OFFLINE TEXT (Channel-specific muna bago Global)
  useEffect(() => {
    let isMounted = true;
    
    const fetchOfflineText = async () => {
      // 1. KUNG MAY NILAGAY KA SA CHANNEL FORM, YUN ANG GAGAMITIN
      if (channel.offlineTitle || channel.offlineMessage) {
        if (isMounted) {
          setOfflineText({
            title: channel.offlineTitle || "Channel is currently offline.",
            message: channel.offlineMessage || "Please try another channel or use a backup link."
          });
        }
      } 
      // 2. KUNG WALANG SPECIFIC SA CHANNEL, KUKUHA SA GLOBAL ADMIN SETTINGS
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
  }, [channel.offlineTitle, channel.offlineMessage]); // Magre-refresh kapag lumipat ng channel

  useEffect(() => {
    setReloadTrigger(0);
    setIsRefreshing(false);
  }, [channel.id]);

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
      
      setIsLoading(true);
      setError(null);
      if (reloadTrigger > 0) setIsRefreshing(true);

      if (uiRef.current) { await uiRef.current.destroy(); uiRef.current = null; }
      if (shakaRef.current) { await shakaRef.current.destroy(); shakaRef.current = null; }
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      try {
        const proxyUrls = channel.useProxy ? await getProxyUrls(channel.proxyType || 'cloudflare') : { primary: '', backup: '', backup2: '', backup3: '', backup4: '', backup5: '', backup6: '' };
        const orderedProxies = channel.useProxy ? pickBestProxy(proxyUrls, channel.proxyOrder) : [];
        
        let streamUrl = channel.manifestUri;
        
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

        const labelMap = new Map<string, string>();
        if (proxyUrls.primary) labelMap.set(proxyUrls.primary, 'Primary');
        if (proxyUrls.backup) labelMap.set(proxyUrls.backup, 'Backup 1');
        if (proxyUrls.backup2) labelMap.set(proxyUrls.backup2, 'Backup 2');
        if (proxyUrls.backup3) labelMap.set(proxyUrls.backup3, 'Backup 3');
        if (proxyUrls.backup4) labelMap.set(proxyUrls.backup4, 'Backup 4');
        if (proxyUrls.backup5) labelMap.set(proxyUrls.backup5, 'Backup 5');
        if (proxyUrls.backup6) labelMap.set(proxyUrls.backup6, 'Backup 6');
        proxyLabelMapRef.current = labelMap;

        let activeProxyUrl = '';

        if (channel.useProxy && orderedProxies.length > 0) {
          const proxiesToTest = orderedProxies.filter(testProxy => {
            if (badProxiesCache.has(testProxy)) {
              if (Date.now() - badProxiesCache.get(testProxy)! < PROXY_TIMEOUT_MS) {
                console.log(`[Proxy Fast-Skip] Nilaktawan ang ${labelMap.get(testProxy)} dahil limit/sira ito.`);
                return false; 
              } else {
                badProxiesCache.delete(testProxy);
              }
            }
            return true;
          });

          if (proxiesToTest.length > 0) {
            if (isMounted) onProxyChange?.('Finding fastest proxy...');

            try {
              const proxyPromises = proxiesToTest.map(testProxy => {
                return new Promise<string>(async (resolve, reject) => {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 3500);
                  
                  try {
                    const testUrl = buildProxiedUrl(testProxy, streamUrl, channel.userAgent, channel.referrer);
                    const res = await fetch(testUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (res.ok) {
                      resolve(testProxy);
                    } else {
                      if (res.status === 429 || res.status >= 500) {
                         badProxiesCache.set(testProxy, Date.now());
                      }
                      reject(new Error(`Status ${res.status}`));
                    }
                  } catch (err) {
                    clearTimeout(timeoutId);
                    badProxiesCache.set(testProxy, Date.now());
                    reject(err);
                  }
                });
              });

              activeProxyUrl = await Promise.any(proxyPromises);
              if (isMounted) onProxyChange?.(labelMap.get(activeProxyUrl) || 'Working Proxy');
              
            } catch (err) {
              console.warn('[Proxy Race] Lahat ng proxy na ni-check ay bagsak.');
            }
          }

          if (!activeProxyUrl) {
             activeProxyUrl = orderedProxies[0];
             if (isMounted) onProxyChange?.(labelMap.get(activeProxyUrl) || 'Primary (Fallback)');
          }
        } else {
          if (isMounted && !channel.useProxy) onProxyChange?.('Direct');
        }

        const proxyUrl = activeProxyUrl;

        const configureShakaProxy = (player: shaka.Player, proxyToUse: string) => {
          if (!proxyToUse) return;
          const netEngine = player.getNetworkingEngine();
          if (!netEngine) return;
          
          netEngine.clearAllRequestFilters();
          const manifestBase = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
          const proxyOrigin = new URL(proxyToUse).origin;
          const proxyPathname = new URL(proxyToUse).pathname;
          
          netEngine.registerRequestFilter((type: any, request: any) => {
            const url = request.uris[0];
            if (!url) return;
            if (!url.startsWith('http')) return;
            if (url.includes('?url=') || url.includes('&url=')) return;
            
            if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
              request.uris[0] = buildProxiedUrl(proxyToUse, url, channel.userAgent, channel.referrer);
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
            request.uris[0] = buildProxiedUrl(proxyToUse, url, channel.userAgent, channel.referrer);
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
              abr: { enabled: true } 
            });
            ui.configure({ overflowMenuButtons: ['quality', 'language', 'captions', 'picture_in_picture', 'cast'], addBigPlayButton: true });
            
            configureShakaProxy(player, proxyUrl);

            try {
              await player.load(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
              if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
            } catch (err) {
              if (isMounted) {
                if (!triggerAutoRefresh()) {
                  setError('Failed to load stream.'); // Ito ang trigger na tatawag sa custom offlineText
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
                       xhr.open('GET', buildProxiedUrl(proxyUrl, fullOriginalUrl, channel.userAgent, channel.referrer), true);
                    } else if (url.startsWith('http')) {
                       xhr.open('GET', buildProxiedUrl(proxyUrl, url, channel.userAgent, channel.referrer), true);
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
              
              let currentProxyIndex = orderedProxies.indexOf(proxyUrl);
              if (currentProxyIndex === -1) currentProxyIndex = 0;

              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal && isMounted) {
                  currentProxyIndex++;
                  if (currentProxyIndex < orderedProxies.length) {
                    const nextProxy = orderedProxies[currentProxyIndex];
                    onProxyChange?.(proxyLabelMapRef.current.get(nextProxy) || `Proxy ${currentProxyIndex + 1}`);
                    hls.loadSource(buildProxiedUrl(nextProxy, streamUrl, channel.userAgent, channel.referrer));
                    return;
                  }
                  
                  if (!triggerAutoRefresh()) {
                    setError('Channel is currently offline.'); // Trigger
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
            drm: { clearKeys: channel.clearKey || {}, servers: channel.widevineUrl ? { 'com.widevine.alpha': channel.widevineUrl } : {} } 
          });
          ui.configure({ overflowMenuButtons: ['quality', 'language', 'captions', 'picture_in_picture', 'cast'], addBigPlayButton: true });
          
          configureShakaProxy(player, proxyUrl);

          try {
            await player.load(proxyUrl ? buildProxiedUrl(proxyUrl, streamUrl, channel.userAgent, channel.referrer) : streamUrl);
            if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
          } catch (err) {
            let dashRecovered = false;
            let startIndex = orderedProxies.indexOf(proxyUrl);
            if (startIndex === -1) startIndex = 0;

            for (let i = startIndex + 1; i < orderedProxies.length; i++) {
              const fallbackProxy = orderedProxies[i];
              configureShakaProxy(player, fallbackProxy);
              try {
                await player.load(buildProxiedUrl(fallbackProxy, streamUrl, channel.userAgent, channel.referrer));
                if (isMounted) { setIsLoading(false); setIsRefreshing(false); onProxyChange?.(proxyLabelMapRef.current.get(fallbackProxy) || `Proxy ${i + 1}`); videoRef.current?.play().catch(() => {}); }
                dashRecovered = true;
                break;
              } catch (retryErr) {}
            }
            if (!dashRecovered && isMounted) {
              if (!triggerAutoRefresh()) {
                setError('Channel is currently offline.'); // Trigger
                setIsLoading(false);
                setIsRefreshing(false);
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) { setError('Failed to initialize player.'); setIsLoading(false); setIsRefreshing(false); }
      }
    };

    loadPlayer();

    return () => {
      isMounted = false;
      if (uiRef.current) { uiRef.current.destroy(); uiRef.current = null; }
      if (shakaRef.current) { shakaRef.current.destroy().catch(() => {}); shakaRef.current = null; }
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
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
              {/* DISPLAY OFFLINE TEXT TITLES HERE */}
              {offlineText.title}
            </p>
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{offlineText.message}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative w-full h-full">
        <video ref={videoRef} className="w-full h-full" autoPlay playsInline />
        {hlsLevels.length > 1 && hlsRef.current && (
          <div className="absolute top-2 right-2 z-30">
            <button onClick={() => setShowQualityMenu(prev => !prev)} className="bg-background/80 backdrop-blur-sm border-2 border-border rounded-lg p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
              <Settings className="w-6 h-6 text-foreground" />
            </button>
            {showQualityMenu && (
              <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[140px]">
                <button onClick={() => handleQualityChange(-1)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent ${currentLevel === -1 ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {currentLevel === -1 && <Check className="w-4 h-4" />}<span className={currentLevel === -1 ? '' : 'ml-6'}>Auto</span>
                </button>
                {hlsLevels.map((level) => (
                  <button key={level.index} onClick={() => handleQualityChange(level.index)} className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent ${currentLevel === level.index ? 'text-primary font-semibold' : 'text-foreground'}`}>
                    {currentLevel === level.index && <Check className="w-4 h-4" />}<span className={currentLevel === level.index ? '' : 'ml-6'}>{level.height}p</span>
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
        <iframe src={`${channel.embedUrl}&autoplay=1`} title={channel.name} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border relative">
        <PlayerCore key={channel.id} channel={channel} onStatusChange={onStatusChange} onProxyChange={setActiveProxyLabel} />
      </div>
      {activeProxyLabel && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Proxy: <span className={`font-medium ${activeProxyLabel === 'Primary' ? 'text-primary' : activeProxyLabel === 'Direct' ? 'text-muted-foreground' : 'text-accent-foreground'}`}>{activeProxyLabel}</span></span>
        </div>
      )}
    </div>
  );
};
