import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Wifi, Cloud, Server, AlertCircle } from "lucide-react";

interface IptvConfig {
  type: "stalker" | "xtream";
  portal_url: string;
  mac_address: string;
  server_url: string;
  username: string;
  password: string;
  cloudflare_proxy_url: string;
  cloudflare_proxy_url_backup: string;
  cloudflare_proxy_url_backup2: string;
  cloudflare_proxy_url_backup3: string;
  cloudflare_proxy_url_backup4: string;
  cloudflare_proxy_url_backup5: string;
  cloudflare_proxy_url_backup6: string;
  supabase_proxy_url: string;
  supabase_proxy_url_backup: string;
  supabase_proxy_url_backup2: string;
  supabase_proxy_url_backup3: string;
  supabase_proxy_url_backup4: string;
  supabase_proxy_url_backup5: string;
  supabase_proxy_url_backup6: string;
  vercel_proxy_url: string;
  vercel_proxy_url_backup: string;
  vercel_proxy_url_backup2: string;
  vercel_proxy_url_backup3: string;
  vercel_proxy_url_backup4: string;
  vercel_proxy_url_backup5: string;
  vercel_proxy_url_backup6: string;
  // BAGONG FIELDS PARA SA OFFLINE MESSAGE
  offline_title: string;
  offline_message: string;
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
  cloudflare_proxy_url_backup2: "",
  cloudflare_proxy_url_backup3: "",
  cloudflare_proxy_url_backup4: "",
  cloudflare_proxy_url_backup5: "",
  cloudflare_proxy_url_backup6: "",
  supabase_proxy_url: "",
  supabase_proxy_url_backup: "",
  supabase_proxy_url_backup2: "",
  supabase_proxy_url_backup3: "",
  supabase_proxy_url_backup4: "",
  supabase_proxy_url_backup5: "",
  supabase_proxy_url_backup6: "",
  vercel_proxy_url: "",
  vercel_proxy_url_backup: "",
  vercel_proxy_url_backup2: "",
  vercel_proxy_url_backup3: "",
  vercel_proxy_url_backup4: "",
  vercel_proxy_url_backup5: "",
  vercel_proxy_url_backup6: "",
  // DEFAULT TEXTS
  offline_title: "Channel is currently offline.",
  offline_message: "Please try another channel or use a backup link.",
};

const PROXY_FIELDS = [
  { suffix: "", label: "Primary" },
  { suffix: "_backup", label: "Backup 1" },
  { suffix: "_backup2", label: "Backup 2" },
  { suffix: "_backup3", label: "Backup 3" },
  { suffix: "_backup4", label: "Backup 4" },
  { suffix: "_backup5", label: "Backup 5" },
  { suffix: "_backup6", label: "Backup 6" },
];

interface ProxySectionProps {
  title: string;
  icon: React.ReactNode;
  prefix: "cloudflare_proxy_url" | "supabase_proxy_url" | "vercel_proxy_url";
  config: IptvConfig;
  onChange: (config: IptvConfig) => void;
  placeholder: string;
  description: string;
}

const ProxySection = ({ title, icon, prefix, config, onChange, placeholder, description }: ProxySectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold">
      {icon}
      {title}
    </div>
    <p className="text-xs text-muted-foreground">{description}</p>
    {PROXY_FIELDS.map(({ suffix, label }) => {
      const key = `${prefix}${suffix}` as keyof IptvConfig;
      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            placeholder={placeholder}
            value={config[key] as string}
            onChange={(e) => onChange({ ...config, [key]: e.target.value })}
          />
        </div>
      );
    })}
  </div>
);

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
        const merged = { ...defaultConfig };
        for (const k of Object.keys(defaultConfig) as (keyof IptvConfig)[]) {
          if (val[k] !== undefined) (merged as any)[k] = val[k] as string;
        }
        setConfig(merged);
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
    <Card className="bg-card border-border mb-8">
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

        {/* Proxy URLs - Two Sections */}
        <div className="space-y-6 border-t border-border pt-4">
          <ProxySection
            title="Cloudflare Workers Proxy"
            icon={<Cloud className="h-4 w-4 text-orange-500" />}
            prefix="cloudflare_proxy_url"
            config={config}
            onChange={setConfig}
            placeholder="https://hls-proxy.your-subdomain.workers.dev"
            description="Deploy the Cloudflare Worker from cloudflare-worker/hls-proxy.js. I-set ang Primary at hanggang 6 na backup URLs."
          />

          <div className="border-t border-border pt-4">
            <ProxySection
              title="Supabase Edge Functions Proxy"
              icon={<Server className="h-4 w-4 text-green-500" />}
              prefix="supabase_proxy_url"
              config={config}
              onChange={setConfig}
              placeholder="https://your-project.supabase.co/functions/v1/stream-proxy"
              description="Supabase Edge Function proxy URLs. I-set ang Primary at hanggang 6 na backup URLs."
            />
          </div>

          <div className="border-t border-border pt-4">
            <ProxySection
              title="Vercel Specialized HLS Proxy"
              icon={<Server className="h-4 w-4 text-purple-500" />}
              prefix="vercel_proxy_url"
              config={config}
              onChange={setConfig}
              placeholder="https://your-app.vercel.app/api/hls"
              description="Vercel Specialized HLS proxy URLs. Ito ay magaling sa pag-rewrite ng manifests. I-set ang Primary at backups."
            />
          </div>
        </div>

        {/* BAGONG SECTION PARA SA OFFLINE MESSAGES */}
        <div className="space-y-4 border-t border-border pt-4 mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Player Offline Message
          </div>
          <p className="text-xs text-muted-foreground">
            I-customize kung ano ang mababasa ng users kapag nagka-error o patay ang Live TV channel.
          </p>

          <div className="space-y-2">
            <Label htmlFor="offline_title">Main Error Title</Label>
            <Input
              id="offline_title"
              placeholder="Channel is currently offline."
              value={config.offline_title || ""}
              onChange={(e) => setConfig({ ...config, offline_title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offline_message">Sub-message / Instruction</Label>
            <Input
              id="offline_message"
              placeholder="Please try another channel or use a backup link."
              value={config.offline_message || ""}
              onChange={(e) => setConfig({ ...config, offline_message: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
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
