import { useState } from 'react';
import { CATEGORIES } from '@/lib/channelCategories';
import { Loader2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { DEFAULT_PROXY_ORDER, PROXY_LABELS, type ProxyKey } from '@/lib/channels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateChannel, useUpdateChannel, type DbChannel, type ChannelInput } from '@/hooks/useChannels';
import { toast } from 'sonner';

// Helper to convert YouTube URLs to embed format
const convertToYouTubeEmbed = (url: string): string => {
  if (!url) return url;
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId: string | null = null;
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) videoId = watchMatch[1];
  
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) videoId = shortMatch[1];
  
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) videoId = liveMatch[1];
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  return url;
};

interface ChannelFormProps {
  channel?: DbChannel | null;
  onClose: () => void;
}

export function ChannelForm({ channel, onClose }: ChannelFormProps) {
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const isEditing = !!channel;

  const [formData, setFormData] = useState<ChannelInput>({
    name: channel?.name || '',
    logo_url: channel?.logo_url || '',
    stream_url: channel?.stream_url || '',
    stream_type: channel?.stream_type || 'hls',
    license_type: channel?.license_type || null,
    drm_key_id: channel?.drm_key_id || '',
    drm_key: channel?.drm_key || '',
    license_url: channel?.license_url || '',
    category: channel?.category || 'general',
    is_active: channel?.is_active ?? true,
    sort_order: channel?.sort_order ?? 0,
    user_agent: channel?.user_agent || '',
    referrer: channel?.referrer || '',
    use_proxy: channel?.use_proxy ?? false,
    proxy_order: (channel?.proxy_order as ProxyKey[] | null) || null,
    tvapp_slug: channel?.tvapp_slug || '',
    proxy_type: (channel as any)?.proxy_type || 'none',
    epg_id: (channel as any)?.epg_id || '',
    channel_num: (channel as any)?.channel_num || '',
    epg_url: (channel as any)?.epg_url || '',
  });

  const proxyOrder: ProxyKey[] = (formData.proxy_order as ProxyKey[]) || [...DEFAULT_PROXY_ORDER];

  const moveProxy = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...proxyOrder];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setFormData({ ...formData, proxy_order: newOrder });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.stream_url.trim()) {
      toast.error('Name and Stream URL are required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        drm_key_id: formData.drm_key_id || null,
        drm_key: formData.drm_key || null,
        license_type: formData.license_type || null,
        license_url: formData.license_url || null,
        user_agent: formData.user_agent || null,
        referrer: formData.referrer || null,
        tvapp_slug: formData.tvapp_slug || null,
        use_proxy: formData.proxy_type !== 'none',
        proxy_type: formData.proxy_type || 'none',
        epg_id: formData.epg_id || null,
        channel_num: formData.channel_num || null,
        epg_url: formData.epg_url || null,
      };

      if (isEditing && channel) {
        await updateChannel.mutateAsync({ id: channel.id, ...submitData });
        toast.success('Channel updated');
      } else {
        await createChannel.mutateAsync(submitData);
        toast.success('Channel created');
      }
      onClose();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update channel' : 'Failed to create channel');
    }
  };

  const isPending = createChannel.isPending || updateChannel.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Channel' : 'Add New Channel'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="GMA 7"
            />
          </div>

          {/* Channel Number & EPG ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel_num">Channel No.</Label>
              <Input
                id="channel_num"
                value={formData.channel_num || ''}
                onChange={(e) => setFormData({ ...formData, channel_num: e.target.value })}
                placeholder="001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epg_id">EPG ID / Name</Label>
              <Input
                id="epg_id"
                value={formData.epg_id || ''}
                onChange={(e) => setFormData({ ...formData, epg_id: e.target.value })}
                placeholder="GMA.PH"
              />
            </div>
          </div>

          {/* External EPG URL */}
          <div className="space-y-2">
            <Label htmlFor="epg_url">External EPG XML URL (Optional)</Label>
            <Input
              id="epg_url"
              value={formData.epg_url || ''}
              onChange={(e) => setFormData({ ...formData, epg_url: e.target.value })}
              placeholder="https://example.com/guide.xml"
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground">For manual channels. Leave empty to use Portal EPG.</p>
          </div>

          {/* Stream URL */}
          <div className="space-y-2">
            <Label htmlFor="stream_url">Stream URL *</Label>
            <Input
              id="stream_url"
              value={formData.stream_url}
              onChange={(e) => {
                let url = e.target.value;
                if (formData.stream_type === 'youtube') {
                  url = convertToYouTubeEmbed(url);
                }
                
                // Auto-detect domains that require proxy
                const proxyRequiredDomains = ['amagi.tv', 'magatv', 'now3.amagi', 'linear-abp', 'rakuten.tv'];
                const needsProxy = proxyRequiredDomains.some(domain => url.toLowerCase().includes(domain));
                
                if (needsProxy && formData.proxy_type === 'none') {
                  toast.info('Restricted domain detected. Automatically enabling Cloudflare proxy.', {
                    description: 'This stream usually requires a proxy to play in the browser.',
                  });
                  setFormData({ ...formData, stream_url: url, proxy_type: 'cloudflare', use_proxy: true });
                } else {
                  setFormData({ ...formData, stream_url: url });
                }
              }}
              placeholder={formData.stream_type === 'youtube' 
                ? "Paste any YouTube URL (auto-converts to embed)" 
                : "https://example.com/stream.m3u8"}
            />
          </div>

          {/* Stream Type */}
          <div className="space-y-2">
            <Label htmlFor="stream_type">Stream Type</Label>
            <Select
              value={formData.stream_type}
              onValueChange={(value: 'mpd' | 'hls' | 'youtube') =>
                setFormData({ ...formData, stream_type: value })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hls">HLS (.m3u8)</SelectItem>
                <SelectItem value="mpd">DASH (.mpd)</SelectItem>
                <SelectItem value="youtube">YouTube Embed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category || 'general'}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* DRM Configuration (for MPD/HLS streams) */}
          {(formData.stream_type === 'mpd' || formData.stream_type === 'hls') && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium">DRM Configuration (Optional)</p>
              <div className="space-y-2">
                <Label htmlFor="license_type">DRM Type</Label>
                <Select
                  value={formData.license_type || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, license_type: value === 'none' ? null : value as 'clearkey' | 'widevine' })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select DRM type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No DRM</SelectItem>
                    <SelectItem value="clearkey">ClearKey</SelectItem>
                    <SelectItem value="widevine">Widevine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.license_type === 'clearkey' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="drm_key_id">Key ID</Label>
                    <Input id="drm_key_id" value={formData.drm_key_id || ''} onChange={(e) => setFormData({ ...formData, drm_key_id: e.target.value })} className="font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drm_key">Key</Label>
                    <Input id="drm_key" value={formData.drm_key || ''} onChange={(e) => setFormData({ ...formData, drm_key: e.target.value })} className="font-mono text-sm" />
                  </div>
                </div>
              )}

              {formData.license_type === 'widevine' && (
                <div className="space-y-2">
                  <Label htmlFor="license_url">Widevine License URL</Label>
                  <Input id="license_url" value={formData.license_url || ''} onChange={(e) => setFormData({ ...formData, license_url: e.target.value })} className="font-mono text-sm" />
                </div>
              )}
            </div>
          )}

          {/* Custom Headers */}
          <div className="space-y-2">
            <Label htmlFor="user_agent">Custom User-Agent</Label>
            <Input id="user_agent" value={formData.user_agent || ''} onChange={(e) => setFormData({ ...formData, user_agent: e.target.value })} className="font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrer">Custom Referrer</Label>
            <Input id="referrer" value={formData.referrer || ''} onChange={(e) => setFormData({ ...formData, referrer: e.target.value })} className="font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tvapp_slug">TVApp Slug (Auto-resolve)</Label>
            <Input id="tvapp_slug" value={formData.tvapp_slug || ''} onChange={(e) => setFormData({ ...formData, tvapp_slug: e.target.value })} className="font-mono text-sm" />
          </div>

          {/* Proxy Provider */}
          <div className="space-y-2">
            <Label htmlFor="proxy_type">Proxy Provider</Label>
            <Select
              value={formData.proxy_type || 'none'}
              onValueChange={(value) => setFormData({ ...formData, proxy_type: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Direct (No Proxy)</SelectItem>
                <SelectItem value="cloudflare">Cloudflare Workers</SelectItem>
                <SelectItem value="supabase">Supabase Edge Functions</SelectItem>
                <SelectItem value="vercel">Vercel HLS Proxy (Specialized)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.proxy_type !== 'none' && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border">
              <Label>Proxy Priority Order</Label>
              <div className="space-y-1">
                {proxyOrder.map((key, index) => (
                  <div key={key} className="flex items-center gap-2 p-2 rounded bg-background border border-border">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 font-medium">{PROXY_LABELS[key]}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveProxy(index, 'up')}><ArrowUp className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === proxyOrder.length - 1} onClick={() => moveProxy(index, 'down')}><ArrowDown className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">Channel will be visible to users</p>
            </div>
            <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input id="sort_order" type="number" value={formData.sort_order ?? 0} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
