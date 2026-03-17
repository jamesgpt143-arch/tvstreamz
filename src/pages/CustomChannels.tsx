import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Tv, Pencil, Trash2, Loader2, Play } from "lucide-react";
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
  });

  useEffect(() => {
    fetchAuthAndChannels();
  }, []);

  const fetchAuthAndChannels = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const handleOpenModal = (channel?: CustomChannel) => {
    if (channel) {
      setFormData({
        id: channel.id,
        name: channel.name,
        stream_url: channel.stream_url,
        logo_url: channel.logo_url || '',
        stream_type: channel.stream_type,
      });
    } else {
      setFormData({ id: '', name: '', stream_url: '', logo_url: '', stream_type: 'hls' });
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
    // Format it into standard Channel object so LivePlayer can read it
    const mappedChannel: Channel = {
      id: ch.id,
      name: ch.name,
      manifestUri: ch.stream_url,
      type: ch.stream_type,
      logo: ch.logo_url || '',
      useProxy: true,           // SAPILITAN NATING IPAPADAAN SA CLOUDFLARE PARA HINDI MAG-CORS
      proxyType: 'cloudflare' 
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
                  
                  {/* Show Edit/Delete only to owner or admin */}
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

        {/* ADD/EDIT MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{formData.id ? 'Edit Channel' : 'Add Custom Channel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Channel Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. My Favorite Movie Stream" />
              </div>
              <div className="space-y-2">
                <Label>Stream URL (.m3u8 / .mpd / YouTube)</Label>
                <Input required value={formData.stream_url} onChange={e => setFormData({...formData, stream_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Logo URL (Optional)</Label>
                <Input type="url" value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Stream Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.stream_type} 
                  onChange={e => setFormData({...formData, stream_type: e.target.value as any})}
                >
                  <option value="hls">HLS (.m3u8)</option>
                  <option value="mpd">DASH (.mpd)</option>
                  <option value="youtube">YouTube URL</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Channel
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* PLAYER POPUP */}
        <Dialog open={!!playingChannel} onOpenChange={(open) => !open && setPlayingChannel(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-border">
            {playingChannel && (
              <div className="w-full aspect-video">
                <LivePlayer channel={playingChannel} />
              </div>
            )}
            <div className="p-4 bg-card border-t border-border">
              <h3 className="font-semibold text-lg">{playingChannel?.name}</h3>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default CustomChannels;
