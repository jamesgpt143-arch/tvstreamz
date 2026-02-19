import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Wifi } from "lucide-react";

interface IptvConfig {
  type: "stalker" | "xtream";
  portal_url: string;
  mac_address: string;
  server_url: string;
  username: string;
  password: string;
  cloudflare_proxy_url: string;
  cloudflare_proxy_url_backup: string;
}

const defaultConfig: IptvConfig = {
  type: "stalker",
  portal_url: "",
  mac_address: "",
  server_url: "",
  username: "",
  password: "",
  cloudflare_proxy_url: "",
  cloudflare_proxy_url_backup: "",
};

export const IptvSettings = () => {
  const [config, setConfig] = useState<IptvConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "iptv_config")
        .single();

      if (data?.value) {
        const val = data.value as Record<string, unknown>;
        setConfig({
          type: (val.type as "stalker" | "xtream") || "stalker",
          portal_url: (val.portal_url as string) || "",
          mac_address: (val.mac_address as string) || "",
          server_url: (val.server_url as string) || "",
          username: (val.username as string) || "",
          password: (val.password as string) || "",
          cloudflare_proxy_url: (val.cloudflare_proxy_url as string) || "",
          cloudflare_proxy_url_backup: (val.cloudflare_proxy_url_backup as string) || "",
        });
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "iptv_config")
        .single();

      if (existing) {
        await supabase.from("site_settings").update({ value: config as any }).eq("key", "iptv_config");
      } else {
        await supabase.from("site_settings").insert({ key: "iptv_config", value: config as any });
      }
      toast.success("IPTV settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (config.type === "stalker" && (!config.portal_url || !config.mac_address)) {
      toast.error("Please fill in portal URL and MAC address first");
      return;
    }
    if (config.type === "xtream" && (!config.server_url || !config.username || !config.password)) {
      toast.error("Please fill in server URL, username, and password first");
      return;
    }

    setTesting(true);
    try {
      await saveConfig();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/iptv-proxy?action=channels`, {
        headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
      });
      const data = await res.json();
      if (data.error) {
        toast.error(`Connection failed: ${data.error}`);
      } else {
        toast.success(`Connected! Found ${data.channels?.length || 0} channels`);
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          IPTV Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type selector */}
        <div className="space-y-2">
          <Label>Provider Type</Label>
          <Select value={config.type} onValueChange={(v) => setConfig({ ...config, type: v as "stalker" | "xtream" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stalker">Stalker / MAC Portal</SelectItem>
              <SelectItem value="xtream">Xtream Codes (Username/Password)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.type === "stalker" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="portal_url">Portal URL</Label>
              <Input
                id="portal_url"
                placeholder="http://line.example.com/c/"
                value={config.portal_url}
                onChange={(e) => setConfig({ ...config, portal_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">The Stalker middleware portal URL</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mac_address">MAC Address</Label>
              <Input
                id="mac_address"
                placeholder="00:1A:79:XX:XX:XX"
                value={config.mac_address}
                onChange={(e) => setConfig({ ...config, mac_address: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="server_url">Server URL</Label>
              <Input
                id="server_url"
                placeholder="http://example.com:8080"
                value={config.server_url}
                onChange={(e) => setConfig({ ...config, server_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Xtream Codes server URL (with port)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Cloudflare Proxy URLs - shared across both types */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor="cloudflare_proxy_url">Cloudflare Worker Proxy URL (Primary)</Label>
            <Input
              id="cloudflare_proxy_url"
              placeholder="https://hls-proxy.your-subdomain.workers.dev"
              value={config.cloudflare_proxy_url}
              onChange={(e) => setConfig({ ...config, cloudflare_proxy_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Primary proxy for stream playback. Deploy the Cloudflare Worker from <code>cloudflare-worker/hls-proxy.js</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloudflare_proxy_url_backup">Cloudflare Worker Proxy URL (Backup)</Label>
            <Input
              id="cloudflare_proxy_url_backup"
              placeholder="https://hls-proxy-backup.your-subdomain.workers.dev"
              value={config.cloudflare_proxy_url_backup}
              onChange={(e) => setConfig({ ...config, cloudflare_proxy_url_backup: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Backup proxy — awtomatikong gagamitin kapag nag-error o nag-limit ang primary.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
