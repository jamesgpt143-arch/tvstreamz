import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tv, Pencil, Trash2, Loader2, Play, MonitorUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LivePlayer } from "@/components/LivePlayer";
import type { Channel } from "@/lib/channels";

interface CustomChannel {
  id: string;
  user_id: string;
  name: string;
  stream_url: string;
  logo_url: string | null;
  stream_type: 'hls' | 'mpd' | 'youtube';
  drm_key_id: string | null;
  drm_key: string | null;
  license_type: 'clearkey' | 'widevine' | null;
  license_url: string | null;
  proxy_type: string | null;
}

const CustomChannels = () => {
  const [channels, setChannels] = useState<CustomChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    stream_url: '',
    logo_url: '',
    stream_type: 'hls' as const,
    drm_key_id: '',
    drm_key: '',
    license_type: 'none' as string,
    license_url: '',
    proxy_type: 'cloudflare'
  });

  useEffect(() => {
    fetchAuthAndChannels();
  }, []);

  const fetchAuthAndChannels = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
        setIsAdmin(!!(roles && roles.length > 0));
      }

      const { data, error } = await supabase
        .from('custom_channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setChannels(data as CustomChannel[]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (channel?: CustomChannel) => {
    if (channel) {
      setFormData({
        id: channel.id,
        name: channel.name,
        stream_url: channel.stream_url,
        logo_url: channel.logo_url || '',
        stream_type: channel.stream_type,
        drm_key_id: channel.drm_key_id || '',
        drm_key: channel.drm_key || '',
        license_type: channel.license_type || 'none',
        license_url: channel.license_url || '',
        proxy_type: channel.proxy_type || 'cloudflare'
      });
    } else {
      setFormData({ 
        id: '', name: '', stream_url: '', logo_url: '', stream_type: 'hls',
        drm_key_id: '', drm_key: '', license_type: 'none', license_url: '', proxy_type: 'cloudflare'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Kailangan mong mag-login muna.");
    setIsSaving(true);

    const payload = {
      name: formData.name,
      stream_url: formData.stream_url,
      logo_url: formData.logo_url || null,
      stream_type: formData.stream_type,
      drm_key_id: formData.drm_key_id || null,
      drm_key: formData.drm_key || null,
      license_type: formData.license_type === 'none' ? null : formData.license_type,
      license_url: formData.license_url || null,
      proxy_type: formData.proxy_type === 'none' ? null : formData.proxy_type,
      user_id: user.id
    };

    if (formData.id) {
      const { error } = await supabase.from('custom_channels').update(payload).eq('id', formData.id);
      if (error) toast.error("Error updating channel");
      else toast.success("Channel updated!");
    } else {
      const { error } = await supabase.from('custom_channels').insert([payload]);
      if (error) toast.error("Error adding channel");
      else toast.success("Channel added!");
    }

    setIsModalOpen(false);
    setIsSaving(false);
    fetchAuthAndChannels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;
    const { error } = await supabase.from('custom_channels').delete().eq('id', id);
    if (error) toast.error("Error deleting channel");
    else {
      toast.success("Channel deleted");
      fetchAuthAndChannels();
    }
  };

  const handlePlay = (ch: CustomChannel) => {
    const mappedChannel: Channel = {
      id: ch.id,
      name: ch.name,
      manifestUri: ch.stream_url,
      type: ch.stream_type,
      logo: ch.logo_url || '',
      clearKey: ch.license_type === 'clearkey' && ch.drm_key_id && ch.drm_key 
        ? { [ch.drm_key_id]: ch.drm_key } : undefined,
      widevineUrl: ch.license_type === 'widevine' && ch.license_url ? ch.license_url : undefined,
      useProxy: ch.proxy_type !== null && ch.proxy_type !== 'none',
      proxyType: ch.proxy_type || 'cloudflare' 
    };
    setPlayingChannel(mappedChannel);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MonitorUp className="w-6 h-6 text-blue-500" /> Custom Channels
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Watch and share community-added streams</p>
          </div>
          
          {user ? (
            <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4" /> Add Channel
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">Login to Add Channel</Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : channels.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-card/50">
            <Tv className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Wala pang nakakapag-add ng custom channel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-card border border-border rounded-xl p-4 flex flex-col group transition-all hover:border-blue-500/50">
                <div className="flex items-start gap-3 mb-4">
                  {ch.logo_url ? (
                    <img src={ch.logo_url} alt={ch.name} className="w-12 h-12 rounded bg-secondary/50 object-contain p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-secondary/50 flex items-center justify-center">
                      <Tv className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{ch.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase">{ch.stream_type}</p>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
                  <Button onClick={() => handlePlay(ch)} size="sm" className="flex-1 gap-2">
                    <Play className="w-4 h-4" /> Play
                  </Button>
                  
                  {(user?.id === ch.user_id || isAdmin) && (
                    <>
                      <Button onClick={() => handleOpenModal(ch)} size="icon" variant="outline" className="w-9 h-9">
                        <Pencil className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button onClick={() => handleDelete(ch.id)} size="icon" variant="outline" className="w-9 h-9">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADVANCED ADD/EDIT MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formData.id ? 'Edit Channel' : 'Add Custom Channel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-2">
                <Label>Channel Name *</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. GMA 7" />
              </div>

              <div className="space-y-2">
                <Label>Stream URL *</Label>
                <Input required value={formData.stream_url} onChange={e => setFormData({...formData, stream_url: e.target.value})} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stream Type</Label>
                  <Select value={formData.stream_type} onValueChange={(val: any) => setFormData({...formData, stream_type: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hls">HLS (.m3u8)</SelectItem>
                      <SelectItem value="mpd">DASH (.mpd)</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input type="url" value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} placeholder="https://..." />
                </div>
              </div>

              {/* ADVANCED SETTINGS */}
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">Advanced Settings</h4>
                
                <div className="space-y-2">
                  <Label>Proxy Provider</Label>
                  <Select value={formData.proxy_type} onValueChange={(val) => setFormData({...formData, proxy_type: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Direct (No Proxy)</SelectItem>
                      <SelectItem value="cloudflare">Cloudflare Workers</SelectItem>
                      <SelectItem value="supabase">Supabase Edge Functions</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Kailangan ito para maiwasan ang CORS error sa mga streams.</p>
                </div>

                {(formData.stream_type === 'hls' || formData.stream_type === 'mpd') && (
                  <div className="space-y-3 p-3 rounded bg-muted/30 border border-border">
                    <Label>DRM Settings</Label>
                    <Select value={formData.license_type} onValueChange={(val) => setFormData({...formData, license_type: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No DRM</SelectItem>
                        <SelectItem value="clearkey">ClearKey</SelectItem>
                        <SelectItem value="widevine">Widevine</SelectItem>
                      </SelectContent>
                    </Select>

                    {formData.license_type === 'clearkey' && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input value={formData.drm_key_id} onChange={e => setFormData({...formData, drm_key_id: e.target.value})} placeholder="Key ID" className="font-mono text-xs" />
                        <Input value={formData.drm_key} onChange={e => setFormData({...formData, drm_key: e.target.value})} placeholder="Key" className="font-mono text-xs" />
                      </div>
                    )}
                    {formData.license_type === 'widevine' && (
                      <Input value={formData.license_url} onChange={e => setFormData({...formData, license_url: e.target.value})} placeholder="License URL" className="mt-2 text-xs" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 
                  {formData.id ? 'Update' : 'Add Channel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!playingChannel} onOpenChange={(open) => !open && setPlayingChannel(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-border">
            {playingChannel && (
              <div className="w-full aspect-video">
                <LivePlayer channel={playingChannel} />
              </div>
            )}
            <div className="p-4 bg-card border-t border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg">{playingChannel?.name}</h3>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CustomChannels;
