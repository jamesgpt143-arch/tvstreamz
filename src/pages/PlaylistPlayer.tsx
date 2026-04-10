import { useState, useMemo, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { LivePlayer } from "@/components/LivePlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShareButton } from "@/components/ShareButton";
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
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import type { Channel } from "@/lib/channels";

interface M3UChannel extends Channel {
  group?: string;
}

const PlaylistPlayer = () => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [channels, setChannels] = useState<M3UChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [activeChannel, setActiveChannel] = useState<M3UChannel | null>(null);
  
  // Proxy States
  const [useProxy, setUseProxy] = useState(false);
  const [proxyType, setProxyType] = useState("cloudflare");
  const [playerKey, setPlayerKey] = useState(0);

  // M3U Parsing Logic
  const parseM3U = useCallback((content: string) => {
    const lines = content.split('\n');
    const parsedChannels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        // Extract attributes from the line
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch) currentChannel.logo = logoMatch[1];
        
        const groupMatch = line.match(/group-title="([^"]+)"/);
        if (groupMatch) currentChannel.group = groupMatch[1];

        // Extract the display name (everything after the last comma)
        const commaIndex = line.lastIndexOf(',');
        if (commaIndex !== -1) {
          currentChannel.name = line.substring(commaIndex + 1).trim();
        } else {
          // Fallback if no comma: try to strip known tags
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
        currentChannel.id = `m3u-${Math.random().toString(36).substring(2, 11)}`;
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
      try {
        const parsed = parseM3U(content);
        setChannels(parsed);
        toast.success(`Loaded ${parsed.length} channels`);
      } catch (err) {
        toast.error("Failed to parse M3U file");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const fetchFromUrl = async () => {
    if (!playlistUrl) return toast.error("Please enter a URL");
    setIsParsing(true);
    setChannels([]);
    try {
      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error("Fetch failed");
      const content = await response.text();
      const parsed = parseM3U(content);
      setChannels(parsed);
      toast.success(`Loaded ${parsed.length} channels from URL`);
    } catch (err) {
      toast.error("Fetch failed. Please try uploading the M3U file directly.");
    } finally {
      setIsParsing(false);
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchesSearch = !searchQuery || ch.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === "all" || ch.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [channels, searchQuery, selectedGroup]);

  const groups = useMemo(() => {
    const g = new Set<string>();
    channels.forEach(ch => { if (ch.group) g.add(ch.group); });
    return Array.from(g).sort();
  }, [channels]);

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
                {channels.length} items loaded from M3U
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative group">
                  <input type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs">
                    <Upload className="w-4 h-4" /> Upload M3U
                  </Button>
               </div>
               <div className="flex items-center gap-2">
                  <Input 
                    placeholder="or paste M3U URL..." 
                    value={playlistUrl} 
                    onChange={e => setPlaylistUrl(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-2xl w-48 lg:w-64"
                  />
                  <Button onClick={fetchFromUrl} variant="secondary" className="h-12 w-12 rounded-2xl p-0">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
               </div>
            </div>
          </div>

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
                      <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{activeChannel.name}</h2>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setActiveChannel(null)} className="rounded-2xl hover:bg-white/5">
                      <XCircle className="w-5 h-5" />
                   </Button>
                </div>

                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
                  <LivePlayer key={`${activeChannel.id}-${playerKey}`} channel={{...activeChannel, useProxy, proxyType}} />
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
                         <Switch checked={useProxy} onCheckedChange={setUseProxy} />
                      </div>
                      <Select value={proxyType} onValueChange={setProxyType}>
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
               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">No Active Stream</h2>
               <p className="text-muted-foreground text-sm max-w-sm uppercase tracking-widest font-bold opacity-40">Load a playlist and pick a channel to start watching</p>
            </div>
          )}

          {/* Channels Section */}
          <div className="space-y-8">
            <h2 className="text-lg font-black uppercase tracking-widest ml-1">Playlist Content</h2>
            
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
               {groups.length > 0 && (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                     <SelectTrigger className="w-full md:w-64 h-12 bg-black/40 border-white/5 rounded-2xl font-black uppercase tracking-widest text-xs">
                        <SelectValue placeholder="All Categories" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {groups.map(g => (
                           <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               )}
            </div>

            {/* Channel Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
               {filteredChannels.length > 0 ? (
                 filteredChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannel(ch); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border ${
                        activeChannel?.id === ch.id 
                        ? 'bg-primary border-primary' 
                        : 'bg-zinc-900 border-white/5'
                      }`}
                    >
                      <div className="aspect-square relative flex items-center justify-center p-4 sm:p-6 bg-black/20">
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
                      </div>
                      
                      <div className="p-2 sm:p-3 bg-inherit">
                         <h3 className={`font-black text-[9px] sm:text-[10px] uppercase tracking-tight line-clamp-1 truncate text-center ${
                           activeChannel?.id === ch.id ? 'text-black' : 'text-white'
                         }`}>
                           {ch.name}
                         </h3>
                      </div>
                    </button>
                 ))
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
    </div>
  );
};

export default PlaylistPlayer;
