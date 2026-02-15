import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Wifi } from "lucide-react";

interface IptvConfig {
  portal_url: string;
  mac_address: string;
}

export const IptvSettings = () => {
  const [config, setConfig] = useState<IptvConfig>({ portal_url: "", mac_address: "" });
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
          portal_url: (val.portal_url as string) || "",
          mac_address: (val.mac_address as string) || "",
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
        await supabase
          .from("site_settings")
          .update({ value: config as any })
          .eq("key", "iptv_config");
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: "iptv_config", value: config as any });
      }

      toast.success("IPTV settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.portal_url || !config.mac_address) {
      toast.error("Please fill in portal URL and MAC address first");
      return;
    }

    setTesting(true);
    try {
      // Save first, then test
      await saveConfig();

      const response = await supabase.functions.invoke("iptv-proxy", {
        body: null,
        method: "GET",
      });

      // Use fetch directly for GET with query params
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
        toast.error(`Connection failed: ${data.error}`);
      } else {
        toast.success(`Connected! Found ${data.channels?.length || 0} channels`);
      }
    } catch (err) {
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
          MAC IPTV Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portal_url">Portal URL</Label>
          <Input
            id="portal_url"
            placeholder="http://line.example.com/c/"
            value={config.portal_url}
            onChange={(e) => setConfig({ ...config, portal_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The IPTV portal URL (e.g., http://line.vueott.com/c/)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mac_address">MAC Address</Label>
          <Input
            id="mac_address"
            placeholder="00:1A:79:XX:XX:XX"
            value={config.mac_address}
            onChange={(e) => setConfig({ ...config, mac_address: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The MAC address for authentication
          </p>
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
