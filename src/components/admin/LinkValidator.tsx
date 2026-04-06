import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChannelStatus {
  id: string;
  name: string;
  url: string;
  proxyType: string;
  useProxy: boolean;
  status: "idle" | "checking" | "active" | "offline" | "error";
  error?: string;
}

export function LinkValidator() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingAll, setValidatingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("id, name, stream_url, proxy_type, use_proxy")
        .order('name');
      
      if (error) throw error;

      const formatted = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        url: c.stream_url,
        proxyType: c.proxy_type || 'none',
        useProxy: c.use_proxy ?? false,
        status: "idle" as const
      }));
      setChannels(formatted);
    } catch (error: any) {
      toast({ title: "Error fetching channels", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateLink = async (channel: ChannelStatus) => {
    updateStatus(channel.id, "checking");
    try {
      // If channel doesn't use proxy, validate directly via edge function
      if (!channel.useProxy || channel.proxyType === 'none') {
        const { data, error } = await supabase.functions.invoke('link-validator', {
          body: { url: channel.url }
        });
        if (error) throw error;
        if (data?.ok) {
          updateStatus(channel.id, "active", `HTTP ${data.status} (${data.contentType?.split(';')[0] || 'ok'})`);
        } else {
          updateStatus(channel.id, "offline", `HTTP ${data?.status || 0}: ${data?.error || data?.statusText || 'Offline'}`);
        }
        return;
      }

      // Get proxy settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'iptv_config')
        .maybeSingle();
      
      const config = settings?.value as Record<string, string> | null;
      
      // Pick the right proxy URL based on proxyType
      const prefix = channel.proxyType === 'supabase' ? 'supabase_proxy_url' : 'cloudflare_proxy_url';
      const proxyBase = config?.[prefix] || '';
      
      if (!proxyBase) {
        throw new Error(`No ${channel.proxyType} proxy configured in settings`);
      }

      // For supabase proxy, use the stream-proxy edge function format
      if (channel.proxyType === 'supabase') {
        const proxyUrl = new URL(proxyBase);
        proxyUrl.searchParams.set('url', channel.url);
        // Add headers the stream might need
        if (channel.url.includes('thetvapp')) {
          proxyUrl.searchParams.set('referer', 'https://thetvapp.to/');
        }
        
        const response = await fetch(proxyUrl.toString(), {
          method: 'GET',
          headers: { 'Accept': '*/*' }
        });

        if (response.ok || response.status === 206) {
          const contentType = response.headers.get('content-type') || 'unknown';
          updateStatus(channel.id, "active", `HTTP ${response.status} (${contentType.split(';')[0]})`);
        } else {
          updateStatus(channel.id, "offline", `HTTP ${response.status}: ${response.statusText || 'Offline'}`);
        }
      } else {
        // Cloudflare proxy
        const proxyUrl = new URL(proxyBase);
        proxyUrl.searchParams.set('url', channel.url);

        const response = await fetch(proxyUrl.toString(), {
          method: 'GET',
          headers: { 'Accept': '*/*' }
        });

        if (response.ok || response.status === 206) {
          const contentType = response.headers.get('content-type') || 'unknown';
          updateStatus(channel.id, "active", `HTTP ${response.status} (${contentType.split(';')[0]})`);
        } else {
          updateStatus(channel.id, "offline", `HTTP ${response.status}: ${response.statusText || 'Offline'}`);
        }
      }
    } catch (error: any) {
      console.error(`Validation failed for ${channel.url}:`, error);
      updateStatus(channel.id, "error", error.message || "Proxy error");
    }
  };

  const updateStatus = (id: string, status: ChannelStatus["status"], error?: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, status, error } : c));
  };

  const validateAll = async () => {
    setValidatingAll(true);
    const filtered = channels.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Process in batches of 3 to avoid hammering the network/browser
    const batchSize = 3;
    for (let i = 0; i < filtered.length; i += batchSize) {
      const batch = filtered.slice(i, i + batchSize);
      await Promise.all(batch.map(c => validateLink(c.id, c.url)));
    }
    setValidatingAll(false);
    toast({ title: "Validation complete", description: `Checked ${filtered.length} channels.` });
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Stream Link Validator
              </CardTitle>
              <CardDescription>Manually check if your live stream links are still active.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchChannels}
                disabled={validatingAll}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reload List
              </Button>
              <Button 
                size="sm" 
                onClick={validateAll}
                disabled={validatingAll || filteredChannels.length === 0}
              >
                {validatingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Validate {searchQuery ? 'Filtered' : 'All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 bg-muted/50 p-2 rounded-lg">
            <Search className="h-4 w-4 text-muted-foreground ml-2" />
            <Input 
              placeholder="Search channels..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 shadow-none h-8"
            />
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[30%]">Channel Name</TableHead>
                  <TableHead className="w-[45%]">Stream URL</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No channels found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChannels.map((channel) => (
                    <TableRow key={channel.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium text-foreground">{channel.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px] overflow-hidden">
                        {channel.url}
                      </TableCell>
                      <TableCell>
                        {channel.status === "idle" && <Badge variant="secondary" className="opacity-60">Idle</Badge>}
                        {channel.status === "checking" && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                          </div>
                        )}
                        {channel.status === "active" && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium font-sans">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reachable
                          </div>
                        )}
                        {channel.status === "offline" && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" /> {channel.error || "Offline"}
                          </div>
                        )}
                        {channel.status === "error" && (
                          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Error
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => validateLink(channel.id, channel.url)}
                          disabled={channel.status === "checking" || validatingAll}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 italic bg-muted/20 p-2 rounded border border-border/50">
            * Note: Validation is performed server-side to bypass CORS. 
            This identifies the actual HTTP status (e.g., 200 OK vs 404 Not Found) of the stream.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
