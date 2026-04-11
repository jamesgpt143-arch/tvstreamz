import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { LivePlayer } from "@/components/LivePlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShareButton } from "@/components/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  Upload, 
  Link as LinkIcon, 
  Search, 
  Tv, 
  ListMusic, 
  FileJson, 
  PlayCircle,
  XCircle,
  FileCode2,
  RefreshCcw,
  Play,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  History,
  Save,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import type { Channel } from "@/lib/channels";

interface M3UChannel extends Channel {
  group?: string;
}

interface SavedPlaylist {
  id: string;
  name: string;
  url: string;
}

const PlaylistPlayer = () => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [channels, setChannels] = useState<M3UChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [activeChannel, setActiveChannel] = useState<M3UChannel | null>(null);
  
  // Sync States
  const [user, setUser] = useState<any>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [watchHistory, setWatchHistory] = useState<M3UChannel[]>([]);
  const [isLoadingSync, setIsLoadingSync] = useState(false);

  // Smart Doctor State
  const [channelStatuses, setChannelStatuses] = useState<Record<string, { status: 'online' | 'offline' | 'checking'; provider?: string; isFixed?: boolean }>>({});
  const [isDoctorRunning, setIsDoctorRunning] = useState(false);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [hideOffline, setHideOffline] = useState(false);
  const doctorCancelRef = useRef(false);

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [saveTargetUrl, setSaveTargetUrl] = useState("");

  // Proxy States
  const [useProxy, setUseProxy] = useState(true);
  const [proxyType, setProxyType] = useState("cloudflare");
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchSavedData(user.id);
        fetchWatchHistory(user.id);
      }
      
      const lastUrl = localStorage.getItem("tvstreamz_last_m3u_url");
      if (lastUrl) {
        fetchFromUrl(lastUrl, true);
      }
    };
    checkAuth();
  }, []);

  const fetchSavedData = async (userId: string) => {
    setIsLoadingSync(true);
    try {
      const { data: playlists } = await supabase
        .from('user_playlists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (playlists) setSavedPlaylists(playlists);

      const { data: favs } = await supabase
        .from('playlist_favorites')
        .select('url');
      
      if (favs) {
        setFavorites(new Set(favs.map(f => f.url)));
      }
    } catch (err) {
      console.error("Error fetching sync data:", err);
    } finally {
      setIsLoadingSync(false);
    }
  };

  const fetchWatchHistory = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('playlist_watch_history')
        .select('*')
        .order('watched_at', { ascending: false })
        .limit(15);
      
      if (data) {
        const historyChannels: M3UChannel[] = data.map(item => {
          const name = item.name || "Unknown";
          const url = item.url;
          const group = item.group_name || "";
          return {
            id: btoa(unescape(encodeURIComponent(name + url + group))).substring(0, 16),
            name: name,
            manifestUri: url,
            logo: item.logo || '',
            group: group,
            type: url.includes('.mpd') ? 'mpd' : 'hls'
          };
        });
        setWatchHistory(historyChannels);
      }
    } catch (err) {
      console.error("Error fetching watch history:", err);
    }
  };

  const addToWatchHistory = async (ch: M3UChannel) => {
    if (!user) return;
    try {
      await supabase.from('playlist_watch_history').upsert({
        user_id: user.id,
        name: ch.name,
        url: ch.manifestUri,
        logo: ch.logo,
        group_name: ch.group,
        watched_at: new Date().toISOString()
      }, { onConflict: 'user_id,url' });
      
      fetchWatchHistory(user.id);
    } catch (err) {
      console.warn("Failed to update watch history", err);
    }
  };

  const loadChannelSettings = async (channel: M3UChannel) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('channel_settings')
        .select('proxy_type, use_proxy')
        .eq('channel_url', channel.manifestUri)
        .maybeSingle();

      if (data) {
        setUseProxy(data.use_proxy ?? true);
        setProxyType(data.proxy_type || "cloudflare");
      } else {
        setUseProxy(true);
        setProxyType("cloudflare");
      }
    } catch (err) {
      console.warn("Failed to load channel settings", err);
    }
  };

  const saveChannelSettings = async (channel: M3UChannel, pType: string, uProxy: boolean) => {
    if (!user) return;
    try {
      await supabase.from('channel_settings').upsert({
        user_id: user.id,
        channel_url: channel.manifestUri,
        proxy_type: pType,
        use_proxy: uProxy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,channel_url' });
    } catch (err) {
      console.error("Failed to save channel settings", err);
    }
  };

  const handleChannelSelect = async (ch: M3UChannel) => {
    setActiveChannel(null);
    await loadChannelSettings(ch);
    setActiveChannel(ch);
    addToWatchHistory(ch);
    localStorage.setItem("tvstreamz_last_channel_id", ch.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smart Doctor Helper
  const checkOneChannel = async (ch: M3UChannel) => {
    const checkUrl = async (proxyT?: string, useP = true) => {
      try {
        let finalUrl = ch.manifestUri;
        if (useP) {
          const { data } = await supabase.from('site_settings').select('value').eq('key', 'iptv_config').single();
          const config = data?.value as any;
          const prefix = proxyT === 'supabase' ? 'supabase_proxy_url' : 'cloudflare_proxy_url';
          const proxyBase = config?.[prefix];
          if (!proxyBase) return false;
          
          const urlObj = new URL(proxyBase);
          urlObj.searchParams.set('url', ch.manifestUri);
          if (ch.userAgent) urlObj.searchParams.set('ua', ch.userAgent);
          if (ch.referrer) urlObj.searchParams.set('referer', ch.referrer);
          finalUrl = urlObj.toString();
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(finalUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return res.ok;
      } catch {
        return false;
      }
    };

    // 1. Try saved setting
    const isSavedOk = await checkUrl(proxyType, useProxy);
    if (isSavedOk) return { status: 'online' as const, provider: useProxy ? (proxyType === 'cloudflare' ? 'Main' : 'Backup') : 'Direct' };

    // 2. Try Direct
    const isDirectOk = await checkUrl(undefined, false);
    if (isDirectOk) {
      saveChannelSettings(ch, 'none', false);
      return { status: 'online' as const, provider: 'Direct', isFixed: true };
    }

    // 3. Try Main
    const isMainOk = await checkUrl('cloudflare', true);
    if (isMainOk) {
      saveChannelSettings(ch, 'cloudflare', true);
      return { status: 'online' as const, provider: 'Main', isFixed: true };
    }

    // 4. Try Backup
    const isBackupOk = await checkUrl('supabase', true);
    if (isBackupOk) {
      saveChannelSettings(ch, 'supabase', true);
      return { status: 'online' as const, provider: 'Backup', isFixed: true };
    }

    return { status: 'offline' as const };
  };

  const runSmartDoctor = async (scanAll = false) => {
    const listToScan = scanAll ? channels : filteredChannels;
    if (listToScan.length === 0) return toast.error("No channels to check");
    
    setIsDoctorRunning(true);
    setDoctorProgress(0);
    doctorCancelRef.current = false;
    
    const total = listToScan.length;
    const batchSize = 5;
    const newStatuses = { ...channelStatuses };

    try {
      for (let i = 0; i < total; i += batchSize) {
        if (doctorCancelRef.current) break; // Use ref for cancellation
        const batch = listToScan.slice(i, i + batchSize);
        
        // Update status to 'checking'
        batch.forEach(ch => { newStatuses[ch.id] = { status: 'checking' }; });
        setChannelStatuses({ ...newStatuses });

        const results = await Promise.all(batch.map(ch => checkOneChannel(ch)));
        
        results.forEach((res, idx) => {
          const ch = batch[idx];
          newStatuses[ch.id] = res;
        });
        
        setChannelStatuses({ ...newStatuses });
        setDoctorProgress(Math.round(((i + batch.length) / total) * 100));
      }
    } finally {
      setIsDoctorRunning(false);
      if (!doctorCancelRef.current) {
        toast.success(`Check complete! Found ${Object.values(newStatuses).filter(s => s.status === 'online').length} live channels.`);
      } else {
        toast.info("Channel check stopped");
      }
    }
  };

  const clearDoctorResults = () => {
    setChannelStatuses({});
    setHideOffline(false);
    toast.success("Doctor results cleared");
  };

  const parseM3U = useCallback((content: string) => {
    const lines = content.split('\n');
    const parsedChannels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch) currentChannel.logo = logoMatch[1];
        
        const groupMatch = line.match(/group-title="([^"]+)"/);
        if (groupMatch) currentChannel.group = groupMatch[1].trim();

        const commaIndex = line.lastIndexOf(',');
        if (commaIndex !== -1) {
          currentChannel.name = line.substring(commaIndex + 1).trim();
        } else {
          const infoMatch = line.match(/#EXTINF:[-0-9]*,?(.*)/);
          if (infoMatch) {
            currentChannel.name = infoMatch[1].replace(/tvg-logo="[^"]*"/g, '')
                                            .replace(/group-title="[^"]*"/g, '')
                                            .replace(/tvg-id="[^"]*"/g, '')
                                            .replace(/tvg-name="[^"]*"/g, '')
                                            .trim();
          }
        }
      } 
      else if (line.startsWith('#EXTVLCOPT:')) {
        const opt = line.substring(11).trim();
        if (opt.startsWith('http-user-agent=')) {
          currentChannel.userAgent = opt.split('=', 2)[1].replace(/^"(.*)"$/, '$1');
        } else if (opt.startsWith('http-referrer=')) {
          currentChannel.referrer = opt.split('=', 2)[1].replace(/^"(.*)"$/, '$1');
        }
      }
      else if (line.startsWith('#KODIPROP:') || line.startsWith('#EXT-X-KODIPROP:')) {
        const propLine = line.includes(':') ? line.split(':').slice(1).join(':') : line;
        const eqIndex = propLine.indexOf('=');
        if (eqIndex !== -1) {
          const key = propLine.substring(0, eqIndex).trim();
          const value = propLine.substring(eqIndex + 1).trim();
          if (key === 'inputstream.adaptive.license_type') {
            if (value === 'clearkey' || value === 'com.widevine.alpha') currentChannel.type = 'mpd';
          } else if (key === 'inputstream.adaptive.license_key') {
            if (value.includes(':')) {
              const [kid, k] = value.split(':');
              currentChannel.clearKey = { [kid]: k };
            } else if (value.startsWith('http')) currentChannel.widevineUrl = value;
          }
        }
      } else if (line.startsWith('http')) {
        currentChannel.manifestUri = line;
        const targetName = currentChannel.name || "";
        const targetGroup = currentChannel.group || "";
        currentChannel.id = btoa(unescape(encodeURIComponent(targetName + line + targetGroup))).substring(0, 16);
        if (!currentChannel.type) {
          const lowerUri = line.toLowerCase();
          if (lowerUri.includes('.mpd')) {
            currentChannel.type = 'mpd';
          } else if (lowerUri.includes('.m3u8')) {
            currentChannel.type = 'hls';
          } else if (lowerUri.match(/\.(mp4|ts|mkv|avi|mov)$/) || !lowerUri.includes('.')) {
            currentChannel.type = 'plain';
          } else {
            currentChannel.type = 'hls';
          }
        }
        if (!currentChannel.name) currentChannel.name = "Unknown Channel";
        
        currentChannel.useProxy = useProxy;
        currentChannel.proxyType = proxyType;
        parsedChannels.push(currentChannel as M3UChannel);
        currentChannel = {};
      }
    }
    return parsedChannels;
  }, [useProxy, proxyType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIsParsing(true);
      setChannels([]); // Clear existing to prevent "append" effect
      try {
        const parsed = parseM3U(content);
        setChannels(parsed);
        setSelectedGroup("all");
        setSearchQuery("");
        toast.success(`Loaded ${parsed.length} channels`);
      } catch (err) {
        toast.error("Failed to parse M3U file");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const fetchFromUrl = async (url?: string, quiet = false) => {
    const targetUrl = url || playlistUrl;
    if (!targetUrl) return quiet ? null : toast.error("Please enter a URL");
    setIsParsing(true);
    if (!quiet) setChannels([]);
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Fetch failed");
      const content = await response.text();
      const parsed = parseM3U(content);
      setChannels(parsed);
      setSelectedGroup("all");
      setSearchQuery("");
      
      if (!url) setPlaylistUrl("");
      localStorage.setItem("tvstreamz_last_m3u_url", targetUrl);
      
      const lastChanId = localStorage.getItem("tvstreamz_last_channel_id");
      if (lastChanId) {
        const chan = parsed.find(c => c.id === lastChanId);
        if (chan) {
          await loadChannelSettings(chan);
          setActiveChannel(chan);
        }
      }

      if (!quiet) toast.success(`Loaded ${parsed.length} channels from URL`);
    } catch (err) {
      if (!quiet) toast.error("Fetch failed. Please try uploading the M3U file directly.");
    } finally {
      setIsParsing(false);
    }
  };

  const openSaveDialog = () => {
    if (!user) return toast.error("Please login to save playlists");
    if (!playlistUrl) return toast.error("Enter a URL to save first");
    setSaveTargetUrl(playlistUrl);
    setCustomName(playlistUrl.split('/').pop()?.split('?')[0] || "My Playlist");
    setIsSaveModalOpen(true);
  };

  const savePlaylist = async () => {
    if (!customName || !saveTargetUrl) return toast.error("Please fill in all fields");
    
    try {
      const { error } = await supabase.from('user_playlists').insert({
        user_id: user.id,
        name: customName,
        url: saveTargetUrl
      });
      
      if (error) throw error;
      toast.success("Playlist saved!");
      fetchSavedData(user.id);
      setIsSaveModalOpen(false);
    } catch (err) {
      toast.error("Failed to save playlist");
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase.from('user_playlists').delete().eq('id', id);
      if (error) throw error;
      setSavedPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success("Playlist removed");
    } catch (err) {
      toast.error("Failed to delete playlist");
    }
  };

  const toggleFavorite = async (ch: M3UChannel) => {
    if (!user) return toast.error("Please login to use favorites");
    
    const isFav = favorites.has(ch.manifestUri);
    try {
      if (isFav) {
        await supabase.from('playlist_favorites').delete().eq('url', ch.manifestUri);
        const newFavs = new Set(favorites);
        newFavs.delete(ch.manifestUri);
        setFavorites(newFavs);
        toast.success("Removed from favorites");
      } else {
        await supabase.from('playlist_favorites').insert({
          user_id: user.id,
          name: ch.name || "Unknown",
          url: ch.manifestUri,
          logo: ch.logo,
          group_name: ch.group
        });
        const newFavs = new Set(favorites);
        newFavs.add(ch.manifestUri);
        setFavorites(newFavs);
        toast.success("Added to favorites");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchesSearch = !searchQuery || ch.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = 
        selectedGroup === "all" || 
        (selectedGroup === "favorites" && favorites.has(ch.manifestUri)) ||
        ch.group === selectedGroup;
      
      const isOfflineStatus = channelStatuses[ch.id]?.status === 'offline';
      const matchesVisibility = !hideOffline || !isOfflineStatus;
      
      return matchesSearch && matchesGroup && matchesVisibility;
    });
  }, [channels, searchQuery, selectedGroup, favorites, hideOffline, channelStatuses]);

  const groups = useMemo(() => {
    const g = new Set<string>();
    channels.forEach(ch => { if (ch.group) g.add(ch.group); });
    const sortedGroups = Array.from(g).sort();
    if (favorites.size > 0) return ["favorites", ...sortedGroups];
    return sortedGroups;
  }, [channels, favorites]);

  const updateProxyType = (val: string) => {
    setProxyType(val);
    if (activeChannel) saveChannelSettings(activeChannel, val, useProxy);
  };

  const updateUseProxy = (val: boolean) => {
    setUseProxy(val);
    if (activeChannel) saveChannelSettings(activeChannel, proxyType, val);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16 lg:pt-20">
      <Navbar />
      
      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Playlist Player</h1>
              </div>
              <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold opacity-60">
                {channels.length} items loaded {isParsing && "..."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               {/* Saved Playlists Selector */}
               {savedPlaylists.length > 0 && (
                 <Select onValueChange={(url) => { if(url === "none") return; fetchFromUrl(url); }}>
                    <SelectTrigger className="h-12 border-white/10 bg-white/5 rounded-2xl w-48 font-bold uppercase text-[10px] tracking-widest">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <SelectValue placeholder="Saved Playlists" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {savedPlaylists.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-1">
                          <SelectItem value={p.url} className="flex-1">
                            {p.name}
                          </SelectItem>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                 </Select>
               )}

               <div className="relative group">
                  <input type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs">
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
               </div>
               <div className="flex items-center gap-2">
                  <Input 
                    placeholder="or paste M3U URL..." 
                    value={playlistUrl} 
                    onChange={e => setPlaylistUrl(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-2xl w-48 lg:w-64"
                  />
                  <div className="flex gap-1">
                    <Button onClick={() => fetchFromUrl()} variant="secondary" className="h-12 w-12 rounded-2xl p-0" disabled={isParsing}>
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    </Button>
                    <Button onClick={openSaveDialog} variant="ghost" className="h-12 w-12 rounded-2xl p-0 border border-white/5 bg-white/5">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
               </div>
            </div>
          </div>

          {/* Recently Watched Section */}
          {watchHistory.length > 0 && (
            <div className="mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <History className="w-3 h-3 text-primary" /> Recently Watched
                </h2>
              </div>
              <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex gap-3">
                  {watchHistory.map((ch) => (
                    <button
                      key={`recent-${ch.id}`}
                      onClick={() => handleChannelSelect(ch)}
                      className="group flex flex-col items-center w-24 shrink-0"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 group-hover:border-primary/50 relative">
                        {ch.logo ? (
                          <img src={ch.logo} alt="" className="w-full h-full object-contain p-3 opacity-60 group-hover:opacity-100" />
                        ) : (
                          <Tv className="w-6 h-6 text-zinc-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-2">
                           <Play className="w-4 h-4 text-white" fill="currentColor" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-tight mt-2 truncate w-full text-center opacity-40 group-hover:opacity-100">
                        {ch.name}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Active Player Section */}
          {activeChannel ? (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                         {activeChannel.logo ? (
                            <img src={activeChannel.logo} alt="" className="w-full h-full object-contain p-1.5" />
                         ) : (
                            <Tv className="w-5 h-5 text-zinc-600" />
                         )}
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{activeChannel.name}</h2>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{activeChannel.group || 'General'}</p>
                           {channelStatuses[activeChannel.id] && (
                             <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight ${
                               channelStatuses[activeChannel.id].status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                             }`}>
                               {channelStatuses[activeChannel.id].status}
                             </span>
                           )}
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => toggleFavorite(activeChannel)} 
                       className={`rounded-2xl transition-colors ${favorites.has(activeChannel.manifestUri) ? 'text-yellow-500 bg-yellow-500/10' : 'hover:bg-white/5'}`}
                     >
                       <Star className="w-5 h-5" fill={favorites.has(activeChannel.manifestUri) ? "currentColor" : "none"} />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => { setActiveChannel(null); localStorage.removeItem("tvstreamz_last_channel_id"); }} className="rounded-2xl hover:bg-white/5">
                        <XCircle className="w-5 h-5" />
                     </Button>
                   </div>
                </div>

                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
                  <LivePlayer key={`${activeChannel.id}-${proxyType}-${useProxy}-${playerKey}`} channel={{...activeChannel, useProxy, proxyType}} />
                </div>
                
                <div className="mt-4 flex flex-col gap-4">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                         <ShieldCheck className={`w-4 h-4 ${useProxy ? 'text-primary' : 'text-zinc-600'}`} />
                         <span>Proxy: <span className={useProxy ? 'text-white' : ''}>{useProxy ? (proxyType === 'cloudflare' ? 'Main' : 'Backup') : 'OFF'}</span></span>
                      </div>
                      <ShareButton title={`Watch ${activeChannel.name} - Playlist Player`} />
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 border border-white/5">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Enable Proxy</Label>
                         <Switch checked={useProxy} onCheckedChange={updateUseProxy} />
                      </div>
                      <Select value={proxyType} onValueChange={updateProxyType}>
                         <SelectTrigger className="w-40 h-10 border-white/5 bg-black/40 rounded-2xl text-[10px] uppercase font-black tracking-widest">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="cloudflare">Main Provider</SelectItem>
                            <SelectItem value="supabase">Backup Provider</SelectItem>
                         </SelectContent>
                      </Select>
                      <Button variant="ghost" onClick={() => setPlayerKey(k => k + 1)} className="gap-2 text-[10px] font-black uppercase tracking-widest rounded-2xl h-10 px-4">
                         <RefreshCcw className="w-3 h-3" /> Reload
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12 h-64 md:h-80 rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 flex flex-col items-center justify-center text-center p-8">
               <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-zinc-800" fill="currentColor" />
               </div>
               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 {isLoadingSync ? 'animate-pulse' : ''}">
                  {isLoadingSync ? 'Syncing your data...' : 'No Active Stream'}
               </h2>
               <p className="text-muted-foreground text-sm max-w-sm uppercase tracking-widest font-bold opacity-40">Load a playlist and pick a channel to start watching</p>
            </div>
          )}

          {/* Channels Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between ml-1">
               <h2 className="text-lg font-black uppercase tracking-widest">Playlist Content</h2>
               {isDoctorRunning && (
                 <div className="flex items-center gap-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Checking {doctorProgress}%</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { doctorCancelRef.current = true; setIsDoctorRunning(false); }} 
                      className="h-6 px-2 text-[8px] hover:bg-primary/20"
                    >
                      STOP
                    </Button>
                 </div>
               )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl sticky top-2 z-10 shadow-2xl">
               <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search from playlist..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-black/40 border-white/5 rounded-2xl font-bold"
                  />
               </div>
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/5 rounded-2xl">
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 whitespace-nowrap">Hide Offline</Label>
                     <Switch checked={hideOffline} onCheckedChange={setHideOffline} />
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => runSmartDoctor(false)} 
                      disabled={isDoctorRunning}
                      variant="outline" 
                      className={`h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/10 transition-colors ${isDoctorRunning ? 'opacity-50' : ''}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-primary" /> Smart Fixer
                    </Button>
                    <Button 
                      onClick={() => runSmartDoctor(true)} 
                      disabled={isDoctorRunning}
                      variant="ghost" 
                      className="h-12 px-4 rounded-2xl font-black uppercase tracking-widest text-[9px] border border-white/5 hover:bg-white/5"
                    >
                      Scan All
                    </Button>
                    {Object.keys(channelStatuses).length > 0 && (
                      <Button variant="ghost" onClick={clearDoctorResults} className="h-12 w-12 rounded-2xl p-0 border border-white/5 bg-white/5 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {groups.length > 0 && (
                     <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="w-full md:w-64 h-12 bg-black/40 border-white/5 rounded-2xl font-black uppercase tracking-widest text-xs">
                           <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Categories</SelectItem>
                           {groups.map(g => (
                              <SelectItem key={g} value={g} className={g === 'favorites' ? 'text-yellow-500 font-bold' : ''}>
                                {g === 'favorites' ? '⭐ Favorites' : g}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  )}
               </div>
            </div>

            {/* Channel Grid */}
            {/* Channel Grid - Keyed to force refresh on filter change */}
            <div 
              key={`${selectedGroup}-${searchQuery}-${channels.length}`}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 animate-in fade-in duration-500"
            >
               {filteredChannels.length > 0 ? (
                 filteredChannels.map((ch) => {
                    const status = channelStatuses[ch.id];
                    return (
                    <div key={ch.id} className="group relative">
                      <button
                        onClick={() => handleChannelSelect(ch)}
                        className={`w-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border ${
                          activeChannel?.id === ch.id 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                          : 'bg-zinc-900 border-white/5'
                        }`}
                      >
                        <div className="aspect-square w-full relative flex items-center justify-center p-4 sm:p-6 bg-black/20">
                           {ch.logo ? (
                              <img 
                                src={ch.logo} 
                                alt={ch.name} 
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                                loading="lazy"
                              />
                           ) : (
                              <Tv className={`w-8 h-8 ${activeChannel?.id === ch.id ? 'text-black' : 'text-zinc-700'}`} />
                           )}
                           
                           {/* Status Indicator Overlay */}
                           {status && (
                             <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md shadow-lg ${
                               status.status === 'online' ? 'bg-green-500/80 text-white' : 
                               status.status === 'checking' ? 'bg-primary/80 text-white animate-pulse' : 
                               'bg-red-500/80 text-white'
                             }`}>
                               <div className={`w-1 h-1 rounded-full bg-white ${status.status === 'checking' ? 'animate-ping' : ''}`} />
                               {status.isFixed ? 'Fixed' : status.status}
                             </div>
                           )}
                        </div>
                        
                        <div className="p-2 sm:p-3 bg-inherit w-full">
                           <h3 className={`font-black text-[9px] sm:text-[10px] uppercase tracking-tight line-clamp-1 truncate text-center ${
                             activeChannel?.id === ch.id ? 'text-black' : 'text-white'
                           }`}>
                             {ch.name}
                           </h3>
                        </div>
                      </button>
                      
                      {/* Favorite Toggle Overlay */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(ch); }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 z-10 ${
                          favorites.has(ch.manifestUri) 
                          ? 'bg-yellow-500 text-black scale-100 opacity-100 shadow-lg shadow-yellow-500/20' 
                          : 'bg-black/40 text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" fill={favorites.has(ch.manifestUri) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    );
                 })
               ) : (
                  <div className="col-span-full py-20 bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center">
                     <FileCode2 className="w-16 h-16 text-white/5 mb-4" />
                     <h3 className="text-xl font-bold uppercase tracking-tight mb-2">No channels found</h3>
                     <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-40">Try another search or category filter</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Save Playlist Dialog */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-[2rem] max-w-md">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                 <Save className="w-6 h-6 text-primary" />
                 Save Playlist
              </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-6 py-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Playlist Name</Label>
                 <Input 
                   placeholder="e.g. My Favorite Sports" 
                   value={customName}
                   onChange={e => setCustomName(e.target.value)}
                   className="h-12 bg-white/5 border-white/10 rounded-2xl font-bold"
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Playlist URL</Label>
                 <Input 
                   value={saveTargetUrl}
                   readOnly
                   className="h-12 bg-white/5 border-white/10 rounded-2xl font-bold opacity-60 text-xs"
                 />
              </div>
           </div>

           <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)} className="rounded-2xl font-bold uppercase tracking-widest text-xs h-12 flex-1">
                 Cancel
              </Button>
              <Button onClick={savePlaylist} className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 flex-1 shadow-lg shadow-primary/20">
                 Save to Account
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistPlayer;
