import { useState, useMemo, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { LivePlayer, getProxiedLogoUrl } from "@/components/LivePlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  FileCode2,
  RefreshCcw,
  Play,
  XCircle,
  Star,
  Trash2,
  History,
  Save,
  Server,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import type { Channel } from "@/lib/channels";
import { getIptvConfig } from "@/lib/siteSettings";

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
  
  // ==========================================
  // LAZY LOADING STATE (Set to 200 items)
  // ==========================================
  const [visibleCount, setVisibleCount] = useState(200);

  // Sync States
  const [user, setUser] = useState<any>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoadingSync, setIsLoadingSync] = useState(false);

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [saveTargetUrl, setSaveTargetUrl] = useState("");
  const [proxyMode, setProxyMode] = useState<string>("auto");

  // Proxy State
  const [playerKey, setPlayerKey] = useState(0);
  const [logoProxyUrl, setLogoProxyUrl] = useState("");

  // I-reset ang bilang ng visible channels kapag nag-search o nagpalit ng category
  useEffect(() => {
    setVisibleCount(200);
  }, [searchQuery, selectedGroup, channels]);

  useEffect(() => {
    const fetchLogoProxy = async () => {
      const config = await getIptvConfig();
      if (config) {
        setLogoProxyUrl(config.cloudflare_proxy_url || config.supabase_proxy_url || "");
      }
    };
    fetchLogoProxy();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchSavedData(user.id);
      }
      
      let lastUrl = localStorage.getItem("tvstreamz_last_m3u_url");
      
      // Auto-sync: If no local URL but logged in, try to get the most recent from account
      if (!lastUrl && user) {
        const { data: playlists } = await supabase
          .from('user_playlists')
          .select('url')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (playlists && playlists.length > 0) {
          lastUrl = playlists[0].url;
        }
      }

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

  const handleChannelSelect = async (ch: M3UChannel) => {
    setActiveChannel(null);
    const updatedCh = { ...ch, proxyType: proxyMode === 'auto' ? undefined : proxyMode };
    
    setTimeout(() => {
      setActiveChannel(updatedCh);
      localStorage.setItem("tvstreamz_last_channel_id", updatedCh.id);
    }, 50);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        currentChannel.useProxy = true; // Always enable smart proxy race
        parsedChannels.push(currentChannel as M3UChannel);
        currentChannel = {};
      }
    }
    return parsedChannels;
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIsParsing(true);
      setChannels([]);
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
      
      return matchesSearch && matchesGroup;
    });
  }, [channels, searchQuery, selectedGroup, favorites]);

  // ==========================================
  // SLICE ANG CHANNELS NA I-RE-RENDER SA DOM (200 Channels)
  // ==========================================
  const displayedChannels = filteredChannels.slice(0, visibleCount);

  const groups = useMemo(() => {
    const g = new Set<string>();
    channels.forEach(ch => { if (ch.group) g.add(ch.group); });
    const sortedGroups = Array.from(g).sort();
    if (favorites.size > 0) return ["favorites", ...sortedGroups];
    return sortedGroups;
  }, [channels, favorites]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16 lg:pt-20">
      <Navbar />
      
      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-8 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-orange-500" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Playlist Player</h1>
              </div>
              <p className="hidden md:block text-muted-foreground text-[10px] uppercase tracking-widest font-bold opacity-60">
                {channels.length} items loaded {isParsing && "..."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 bg-muted p-4 rounded-[2rem] border border-border">
               <div className="flex gap-2">
                 <div className="relative flex-1 group">
                    <input type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Button variant="outline" className="w-full gap-2 border-border bg-muted hover:bg-accent hover:text-accent-foreground rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">
                      <Upload className="w-4 h-4" /> Upload M3U
                    </Button>
                 </div>
                 
                 {savedPlaylists.length > 0 && (
                    <Select onValueChange={(url) => { if(url === "none") return; fetchFromUrl(url); }}>
                      <SelectTrigger className="h-12 border-border bg-muted rounded-2xl w-full lg:w-48 font-bold uppercase text-[10px] tracking-widest">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-orange-500" />
                          <SelectValue placeholder="Saved" />
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
               </div>

               <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      placeholder="Paste M3U URL..." 
                      value={playlistUrl} 
                      onChange={e => setPlaylistUrl(e.target.value)}
                      className="pl-11 h-12 bg-background/50 border-border rounded-2xl w-full font-bold text-xs text-foreground"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => fetchFromUrl()} variant="secondary" className="h-12 w-12 rounded-2xl p-0 bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/20" disabled={isParsing}>
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    </Button>
                    <Button onClick={openSaveDialog} variant="ghost" className="h-12 w-12 rounded-2xl p-0 border border-border bg-muted hover:bg-accent hover:text-accent-foreground">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
               </div>


            </div>
          </div>

          {/* Active Player Section */}
          {activeChannel ? (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                         {activeChannel.logo ? (
                            <img src={getProxiedLogoUrl(activeChannel.logo, logoProxyUrl)} alt="" className="w-full h-full object-contain p-1.5" />
                         ) : (
                            <Tv className="w-5 h-5 text-zinc-600" />
                         )}
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{activeChannel.name}</h2>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{activeChannel.group || 'General'}</p>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => toggleFavorite(activeChannel)} 
                       className={`rounded-2xl transition-colors ${favorites.has(activeChannel.manifestUri) ? 'text-yellow-500 bg-yellow-500/10' : 'hover:bg-accent hover:text-accent-foreground'}`}
                     >
                       <Star className="w-5 h-5" fill={favorites.has(activeChannel.manifestUri) ? "currentColor" : "none"} />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => { setActiveChannel(null); localStorage.removeItem("tvstreamz_last_channel_id"); }} className="rounded-2xl hover:bg-accent hover:text-accent-foreground">
                        <XCircle className="w-5 h-5" />
                     </Button>
                   </div>
                </div>

                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-border shadow-2xl relative">
                  <LivePlayer key={`${activeChannel.id}-${playerKey}`} channel={activeChannel} />
                </div>
                
                <div className="mt-4 flex flex-col gap-4">
                   <div className="flex items-center justify-between w-full">
                      <ShareButton title={`Watch ${activeChannel.name} - Playlist Player`} />
                      

                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12 h-64 md:h-80 rounded-[3rem] bg-gradient-to-br from-muted/50 to-background border border-border flex flex-col items-center justify-center text-center p-8">
               <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-zinc-800" fill="currentColor" />
               </div>
               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                  No Active Stream
               </h2>
               <p className="text-muted-foreground text-sm max-w-sm uppercase tracking-widest font-bold opacity-40">Load a playlist and pick a channel to start watching</p>
            </div>
          )}

          {/* Channels Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between ml-1">
               <h2 className="text-lg font-black uppercase tracking-widest">Playlist Content</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 p-4 bg-background/80 backdrop-blur-md border border-border rounded-3xl sticky top-2 z-10 shadow-2xl">
               <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search from playlist..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-background/50 border-border rounded-2xl font-bold text-foreground"
                  />
               </div>
               <div className="flex items-center gap-2">
                  {groups.length > 0 && (
                     <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="w-full md:w-64 h-12 bg-background/50 border-border rounded-2xl font-black uppercase tracking-widest text-xs">
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

            <div 
              key={`${selectedGroup}-${searchQuery}`}
              className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 animate-in fade-in duration-500"
            >
               {displayedChannels.length > 0 ? (
                 displayedChannels.map((ch) => {
                    return (
                    <div key={ch.id} className="group relative">
                      <button
                        onClick={() => handleChannelSelect(ch)}
                        className={`w-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border ${
                          activeChannel?.id === ch.id 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                          : 'bg-card border-border'
                        }`}
                      >
                        <div className="aspect-square w-full relative flex items-center justify-center p-4 sm:p-6 bg-muted/20">
                           {ch.logo ? (
                              <img 
                                src={getProxiedLogoUrl(ch.logo, logoProxyUrl)} 
                                alt={ch.name} 
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                                loading="lazy"
                              />
                           ) : (
                              <Tv className={`w-8 h-8 ${activeChannel?.id === ch.id ? 'text-black' : 'text-zinc-700'}`} />
                           )}
                        </div>
                        
                        <div className="p-2 sm:p-3 bg-inherit w-full">
                           <h3 className={`font-black text-[9px] sm:text-[10px] uppercase tracking-tight line-clamp-1 truncate text-center ${
                             activeChannel?.id === ch.id ? 'text-black' : 'text-foreground'
                           }`}>
                             {ch.name}
                           </h3>
                        </div>
                      </button>
                      
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
                  <div className="col-span-full py-20 bg-muted border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center">
                     <FileCode2 className="w-16 h-16 text-muted-foreground/20 mb-4" />
                     <h3 className="text-xl font-bold uppercase tracking-tight mb-2">No channels found</h3>
                     <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-40">Try another search or category filter</p>
                  </div>
               )}

               {/* ========================================== */}
               {/* LOAD MORE BUTTON SA ILALIM NG GRID */}
               {/* ========================================== */}
               {filteredChannels.length > visibleCount && (
                 <div className="col-span-full flex justify-center py-10 mt-4 border-t border-white/5">
                   <Button 
                     onClick={() => setVisibleCount(prev => prev + 200)}
                     variant="outline"
                     className="rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest text-xs h-12 px-8 hover:bg-white/10 gap-2"
                   >
                     Load More Channels <ChevronDown className="w-4 h-4" />
                   </Button>
                 </div>
               )}

            </div>
          </div>
        </div>
      </main>

      {/* Save Playlist Dialog */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-[2rem] max-w-md">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                 <Save className="w-6 h-6 text-primary" />
                 Save Playlist
              </DialogTitle>
              <p className="sr-only">Enter a name for your playlist and save it to your account.</p>
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
