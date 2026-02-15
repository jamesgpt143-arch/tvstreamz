import { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { LivePlayer } from "@/components/LivePlayer";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Radio, WifiOff, Search, Tv, AlertCircle } from "lucide-react";
import type { Channel } from "@/lib/channels";

interface IptvChannel {
  id: string;
  name: string;
  num: number;
  logo: string;
  cmd: string;
  genre: string;
  censored: number;
}

interface IptvGenre {
  id: string;
  name: string;
}

const IPTV = () => {
  const [channels, setChannels] = useState<IptvChannel[]>([]);
  const [genres, setGenres] = useState<IptvGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<IptvChannel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [cloudflareProxyUrl, setCloudflareProxyUrl] = useState<string>("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/iptv-proxy?action=channels`,
        {
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
        }
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setChannels(data.channels || []);
        setGenres(data.genres || []);
        setCloudflareProxyUrl(data.cloudflare_proxy_url || "");
      }
    } catch (err) {
      setError("Failed to connect to IPTV service");
    } finally {
      setLoading(false);
    }
  };

  const playChannel = async (ch: IptvChannel) => {
    setActiveChannel(ch);
    setStreamUrl(null);
    setLoadingStream(true);
    setIsOnline(true);

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/iptv-proxy?action=stream&cmd=${encodeURIComponent(ch.cmd)}`,
        {
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
        }
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoadingStream(false);
        return;
      }

      let url = data.url;
      // Route through Cloudflare Worker proxy for HTTP streams
      if (url && cloudflareProxyUrl) {
        const proxyBase = cloudflareProxyUrl.replace(/\/+$/, "");
        url = `${proxyBase}?url=${encodeURIComponent(url)}`;
      } else if (url && url.startsWith("http://")) {
        // Fallback to edge function proxy if no Cloudflare URL
        url = `${supabaseUrl}/functions/v1/iptv-proxy?action=proxy&url=${encodeURIComponent(url)}`;
      }

      setStreamUrl(url);
    } catch {
      setError("Failed to get stream URL");
    } finally {
      setLoadingStream(false);
    }
  };

  const handleStatusChange = useCallback((online: boolean) => {
    setIsOnline(online);
  }, []);

  // Build Channel object for LivePlayer
  const playerChannel: Channel | null = useMemo(() => {
    if (!activeChannel || !streamUrl) return null;
    
    // IPTV streams are typically TS/HLS - only use mpd if explicitly .mpd
    const isMpd = streamUrl.includes(".mpd") || streamUrl.includes("dash");
    
    return {
      id: String(activeChannel.id),
      name: activeChannel.name,
      manifestUri: streamUrl,
      type: isMpd ? "mpd" : "hls",
      logo: activeChannel.logo || "",
    };
  }, [activeChannel, streamUrl]);

  // Filter and limit channels for performance
  const filteredChannels = useMemo(() => {
    const filtered = channels.filter((ch) => {
      const matchesSearch = !searchQuery || ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === "all" || ch.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
    return filtered.slice(0, 200); // Limit for performance
  }, [channels, searchQuery, selectedGenre]);

  const totalFiltered = useMemo(() => {
    return channels.filter((ch) => {
      const matchesSearch = !searchQuery || ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === "all" || ch.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    }).length;
  }, [channels, searchQuery, selectedGenre]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Connecting to IPTV portal...</p>
        </div>
      </div>
    );
  }

  if (error && !activeChannel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">IPTV Connection Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchChannels}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <ScrollArea className="flex-1 pt-16">
        <main className="pb-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="py-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tv className="h-6 w-6 text-primary" />
                IPTV Player
              </h1>
              <p className="text-sm text-muted-foreground">{channels.length} channels available</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Player Section */}
              <div className="lg:col-span-2">
                {playerChannel && !loadingStream ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {activeChannel?.logo && (
                        <img src={activeChannel.logo} alt="" className="w-8 h-8 object-contain rounded bg-secondary p-1" />
                      )}
                      <div>
                        <h2 className="text-lg font-bold">{activeChannel?.name}</h2>
                        <div className="flex items-center gap-2 text-xs">
                          {isOnline ? (
                            <>
                              <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                              <span className="text-green-500">Live</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="w-3 h-3 text-destructive" />
                              <span className="text-destructive">Offline</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <LivePlayer channel={playerChannel} onStatusChange={handleStatusChange} />

                    <div className="flex justify-start">
                      <ShareButton title={`Watch ${activeChannel?.name} - IPTV`} />
                    </div>
                  </div>
                ) : loadingStream ? (
                  <div className="aspect-video w-full rounded-xl bg-card border border-border flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading stream...</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-card border border-border flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Tv className="h-12 w-12" />
                      <p className="text-sm">Select a channel to start watching</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Channel List */}
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Genre Filter Dropdown */}
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="h-9 text-xs bg-card">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((g) => (
                      <SelectItem key={g.id} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Channels */}
                <div className="border border-border rounded-xl bg-card/50">
                  <ScrollArea className="h-[500px]">
                    <div className="p-2 space-y-1">
                      {filteredChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => playChannel(ch)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                            activeChannel?.id === ch.id
                            ? "bg-primary/10 border-primary/30 border"
                              : "hover:bg-accent/50 border-transparent border"
                          }`}
                        >
                          {ch.logo ? (
                            <img src={ch.logo} alt="" className="w-8 h-8 object-contain rounded bg-secondary/50 p-0.5 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
                              <Tv className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{ch.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ch.genre}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">#{ch.num}</span>
                        </button>
                      ))}

                      {filteredChannels.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">No channels found</p>
                      )}

                      {totalFiltered > 200 && (
                        <p className="text-center text-muted-foreground text-xs py-3">
                          Showing 200 of {totalFiltered} channels. Use search or filter to find more.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default IPTV;
