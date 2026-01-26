import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings, Timer, Users, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface PopAdsSettingsData {
  enabled: boolean;
  siteId: number;
  minBid: number;
  popundersPerIP: string;
  delayBetween: number;
  defaultPerDay: number;
  topmostLayer: string;
}

const defaultSettings: PopAdsSettingsData = {
  enabled: true,
  siteId: 4983507,
  minBid: 0,
  popundersPerIP: "0",
  delayBetween: 0,
  defaultPerDay: 0,
  topmostLayer: "auto",
};

export const PopAdsSettings = () => {
  const [data, setData] = useState<PopAdsSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'popads_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settings?.value) {
        setData({ ...defaultSettings, ...(settings.value as unknown as PopAdsSettingsData) });
      }
    } catch (error) {
      console.error('Error fetching PopAds settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'popads_settings')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: data as unknown as Json })
          .eq('key', 'popads_settings');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key: 'popads_settings', value: data as unknown as Json });

        if (error) throw error;
      }

      toast.success('PopAds settings saved! Changes will take effect on next page load.');
    } catch (error) {
      console.error('Error saving PopAds settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          PopAds Configuration
        </CardTitle>
        <CardDescription>
          Configure PopAds behavior and delay settings. Changes are applied through the proxy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Enable PopAds</Label>
            <p className="text-sm text-muted-foreground">
              Turn PopAds on or off for your site
            </p>
          </div>
          <Switch
            checked={data.enabled}
            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteId" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Site ID
            </Label>
            <Input
              id="siteId"
              type="number"
              value={data.siteId}
              onChange={(e) => setData({ ...data, siteId: parseInt(e.target.value) || 0 })}
              placeholder="Enter site ID"
            />
            <p className="text-xs text-muted-foreground">Your PopAds site identifier</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minBid" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Minimum Bid
            </Label>
            <Input
              id="minBid"
              type="number"
              step="0.001"
              value={data.minBid}
              onChange={(e) => setData({ ...data, minBid: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Minimum CPM bid (0 = no minimum)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delayBetween" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Delay Between Ads (seconds)
            </Label>
            <Input
              id="delayBetween"
              type="number"
              value={data.delayBetween}
              onChange={(e) => setData({ ...data, delayBetween: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Seconds between popunder triggers (0 = no delay)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="popundersPerIP" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Popunders Per IP
            </Label>
            <Input
              id="popundersPerIP"
              type="text"
              value={data.popundersPerIP}
              onChange={(e) => setData({ ...data, popundersPerIP: e.target.value })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Max popunders per IP ("0" = unlimited)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPerDay" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Default Per Day
            </Label>
            <Input
              id="defaultPerDay"
              type="number"
              value={data.defaultPerDay}
              onChange={(e) => setData({ ...data, defaultPerDay: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Default ads per day limit (0 = unlimited)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topmostLayer" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Topmost Layer
            </Label>
            <Input
              id="topmostLayer"
              type="text"
              value={data.topmostLayer}
              onChange={(e) => setData({ ...data, topmostLayer: e.target.value })}
              placeholder="auto"
            />
            <p className="text-xs text-muted-foreground">Layer behavior ("auto" recommended)</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save PopAds Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
