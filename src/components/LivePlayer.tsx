import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Channel, type ProxyKey, DEFAULT_PROXY_ORDER } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone, Settings, Check, Shield, RefreshCw } from 'lucide-react';
import Hls from 'hls.js';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import { supabase } from '@/integrations/supabase/client';

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

    // Temporary Meta Referrer for extra bypass attempt
    const metaTag = document.createElement('meta');
    metaTag.name = "referrer";
    metaTag.content = "no-referrer";
    document.head.appendChild(metaTag);

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
        const proxyUrl = orderedProxies[0] || '';
        
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

        if (proxyUrl && isMounted) onProxyChange?.(labelMap.get(proxyUrl) || 'Direct');
        else if (!channel.useProxy && isMounted) onProxyChange?.('Direct');

        const configureShakaProxy = (player: shaka.Player, activeProxyUrl: string) => {
          if (!activeProxyUrl) return;
          const netEngine = player.getNetworkingEngine();
          if (!netEngine) return;
          
          netEngine.clearAllRequestFilters();
          const manifestBase = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
          const proxyOrigin = new URL(activeProxyUrl).origin;
          const proxyPathname = new URL(activeProxyUrl).pathname;
          
          netEngine.registerRequestFilter((type: any, request: any) => {
            const url = request.uris[0];
            if (!url) return;
            if (!url.startsWith('http')) return;
            if (url.includes('?url=') || url.includes('&url=')) return;
            
            if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
              request.uris[0] = buildProxiedUrl(activeProxyUrl, url, channel.userAgent, channel.referrer);
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
              request.uris[0] = buildProxiedUrl(activeProxyUrl, fullOriginalUrl, channel.userAgent, channel.referrer);
              return;
            }
            request.uris[0] = buildProxiedUrl(activeProxyUrl, url, channel.userAgent, channel.referrer);
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
            ui.configure({ overflowMenuButtons: ['quality', 'captions', 'language', 'picture_in_picture', 'cast'], addBigPlayButton: true });
            player.configure({ drm: { servers: { 'com.widevine.alpha': channel.widevineUrl } }, abr: { enabled: true } });
            configureShakaProxy(player, proxyUrl);

            try {
              await player.load(streamUrl);
              if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
            } catch (err) {
              if (isMounted) {
                if (!triggerAutoRefresh()) {
                  setError('Failed to load stream. Offline or CORS error.');
                  setIsLoading(false);
                  setIsRefreshing(false);
                }
              }
            }
          } else {
            videoRef.current.controls = true; 
            if (Hls.isSupported()) {
              const hlsConfig: any = {
                enableWorker: true,
                lowLatencyMode: true,
                startLevel: -1,
              };

              if (proxyUrl) {
                hlsConfig.xhrSetup = (xhr: XMLHttpRequest, url: string) => {
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
                };
              }

              const hls = new Hls(hlsConfig);
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
              
              let currentProxyIndex = 0;
              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal && isMounted) {
                  
                  // ==========================================
                  // INFINITE PROXY LOOP LOGIC FOR TESTING
                  // ==========================================
                  if (data.type === Hls.ErrorTypes.NETWORK_ERROR && proxyUrl && orderedProxies.length > 0) {
                    
                    // Modulo arithmetic para bumalik sa 0 kapag lumagpas na sa dulo
                    currentProxyIndex = (currentProxyIndex + 1) % orderedProxies.length;
                    const nextProxy = orderedProxies[currentProxyIndex];
                    
                    if (nextProxy) {
                      onProxyChange?.(proxyLabelMapRef.current.get(nextProxy) || `Proxy ${currentProxyIndex + 1}`);
                      hls.loadSource(buildProxiedUrl(nextProxy, streamUrl, channel.userAgent, channel.referrer));
                      return; // Wag ituloy sa error state
                    }
                  } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                    return;
                  }
                  
                  if (!triggerAutoRefresh()) {
                    setError('Failed to load stream. The channel may be offline or blocking access.');
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
          ui.configure({ overflowMenuButtons: ['quality', 'captions'], addBigPlayButton: true });
          player.configure({ drm: { clearKeys: channel.clearKey || {}, servers: channel.widevineUrl ? { 'com.widevine.alpha': channel.widevineUrl } : {} } });
          configureShakaProxy(player, proxyUrl);

          try {
            await player.load(streamUrl);
            if (isMounted) { setIsLoading(false); setIsRefreshing(false); videoRef.current?.play().catch(() => {}); }
          } catch (err) {
            let dashRecovered = false;
            for (let i = 1; i < orderedProxies.length; i++) {
              const fallbackProxy = orderedProxies[i];
              configureShakaProxy(player, fallbackProxy);
              try {
                await player.load(streamUrl);
                if (isMounted) { setIsLoading(false); setIsRefreshing(false); onProxyChange?.(proxyLabelMapRef.current.get(fallbackProxy) || `Proxy ${i + 1}`); videoRef.current?.play().catch(() => {}); }
                dashRecovered = true;
                break;
              } catch (retryErr) {}
            }
            if (!dashRecovered && isMounted) {
              if (!triggerAutoRefresh()) {
                setError('Failed to load stream.');
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
      document.head.removeChild(metaTag);
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-4 text-center z-20">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
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
