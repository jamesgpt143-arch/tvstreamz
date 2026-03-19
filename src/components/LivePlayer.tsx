import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Channel, type ProxyKey, DEFAULT_PROXY_ORDER } from '@/lib/channels';
import { AlertCircle, Loader2, Smartphone, Settings, Check, Shield } from 'lucide-react';
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
            const resolveUrl = `https://${projectId}.supabase.co/functions/v1/tvapp-resolver?slug=${encodeURIComponent(channel.tvappSlug)}`;
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

        if (channel.type === 'hls') {
          if (channel.widevineUrl) {
            videoRef.current.controls = false;
            shaka.polyfill.installAll();
            
            if (!shaka.Player.isBrowserSupported()) {
              if (isMounted) { setError('Browser unsupported.'); setIsLoading(false); }
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
              if (isMounted) { setIsLoading(false); videoRef.current?.play().catch(() => {}); }
            } catch (err) {
