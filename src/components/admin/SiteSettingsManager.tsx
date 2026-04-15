import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ShieldAlert, Globe, Megaphone } from "lucide-react";

export function SiteSettingsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // States for different settings
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
  const [seo, setSeo] = useState({ title: "", description: "", keywords: "", og_image: "" });
  const [announcement, setAnnouncement] = useState({ is_active: false, message: "", bgColor: "#8b5cf6", textColor: "#ffffff", link: "" });
  const [chatSettings, setChatSettings] = useState({ enabled: true });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;

      data.forEach((setting) => {
        const val = setting.value as any;
        if (setting.key === "maintenance_mode") setMaintenance(val || { enabled: false, message: "" });
        if (setting.key === "seo_settings") setSeo(val || { title: "", description: "", keywords: "", og_image: "" });
        if (setting.key === "announcement_settings") setAnnouncement(val || { is_active: false, message: "", bgColor: "#8b5cf6", textColor: "#ffffff", link: "" });
        if (setting.key === "chat_settings") setChatSettings(val || { enabled: true });
      });
    } catch (error: any) {
      toast({ title: "Error fetching settings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: any) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) throw error;
      toast({ title: "Settings saved", description: `${key} updated successfully.` });
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Maintenance Mode */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              <CardTitle>Maintenance Mode</CardTitle>
            </div>
            <Switch
              checked={maintenance.enabled}
              onCheckedChange={(checked) => setMaintenance({ ...maintenance, enabled: checked })}
            />
          </div>
          <CardDescription>When enabled, only admins can access the site features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="m-message">Maintenance Message</Label>
            <Input
              id="m-message"
              placeholder="e.g., We are performing scheduled maintenance..."
              value={maintenance.message}
              onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
            />
          </div>
          <Button 
            onClick={() => handleSave("maintenance_mode", maintenance)} 
            disabled={saving === "maintenance_mode"}
            className="w-full sm:w-auto gap-2"
          >
            {saving === "maintenance_mode" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Maintenance Settings
          </Button>
        </CardContent>
      </Card>

      {/* SEO settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <CardTitle>SEO Manager</CardTitle>
          </div>
          <CardDescription>Manage how your site appears in search engines and social media.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="seo-title">Site Title</Label>
              <Input
                id="seo-title"
                value={seo.title}
                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seo-og">OG Image URL</Label>
              <Input
                id="seo-og"
                value={seo.og_image}
                onChange={(e) => setSeo({ ...seo, og_image: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seo-keywords">Keywords (comma separated)</Label>
            <Input
              id="seo-keywords"
              value={seo.keywords}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seo-desc">Meta Description</Label>
            <Textarea
              id="seo-desc"
              rows={3}
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            />
          </div>
          <Button 
            onClick={() => handleSave("seo_settings", seo)} 
            disabled={saving === "seo_settings"}
            className="w-full sm:w-auto gap-2"
          >
            {saving === "seo_settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save SEO Settings
          </Button>
        </CardContent>
      </Card>

      {/* Announcement Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-purple-500" />
              <CardTitle>Announcement Bar</CardTitle>
            </div>
            <Switch
              checked={announcement.is_active}
              onCheckedChange={(checked) => setAnnouncement({ ...announcement, is_active: checked })}
            />
          </div>
          <CardDescription>A broad bar at the top of the page for important messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ann-message">Message</Label>
            <Input
              id="ann-message"
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ann-bg">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="ann-bg"
                  type="color"
                  className="w-12 p-1 h-10"
                  value={announcement.bgColor}
                  onChange={(e) => setAnnouncement({ ...announcement, bgColor: e.target.value })}
                />
                <Input value={announcement.bgColor} onChange={(e) => setAnnouncement({...announcement, bgColor: e.target.value})} className="flex-1" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ann-text">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="ann-text"
                  type="color"
                  className="w-12 p-1 h-10"
                  value={announcement.textColor}
                  onChange={(e) => setAnnouncement({ ...announcement, textColor: e.target.value })}
                />
                <Input value={announcement.textColor} onChange={(e) => setAnnouncement({...announcement, textColor: e.target.value})} className="flex-1" />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ann-link">Link (optional)</Label>
            <Input
              id="ann-link"
              placeholder="https://..."
              value={announcement.link}
              onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
            />
          </div>
          <Button 
            onClick={() => handleSave("announcement_settings", announcement)} 
            disabled={saving === "announcement_settings"}
            className="w-full sm:w-auto gap-2"
          >
            {saving === "announcement_settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Announcement Settings
          </Button>
        </CardContent>
      </Card>

      {/* Community Chat Settings */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>Community Chat</CardTitle>
            </div>
            <Switch
              checked={chatSettings.enabled}
              onCheckedChange={(checked) => setChatSettings({ enabled: checked })}
            />
          </div>
          <CardDescription>Enable or disable the real-time public chat for all users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => handleSave("chat_settings", chatSettings)} 
            disabled={saving === "chat_settings"}
            className="w-full sm:w-auto gap-2"
          >
            {saving === "chat_settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Chat Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
