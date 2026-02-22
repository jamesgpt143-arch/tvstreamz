import { useState } from 'react';
import { CATEGORIES } from '@/lib/channelCategories';
import { Loader2 } from 'lucide-react';
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
  
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId: string | null = null;
  
  // Match youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) videoId = watchMatch[1];
  
  // Match youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) videoId = shortMatch[1];
  
  // Match youtube.com/live/VIDEO_ID
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.stream_url.trim()) {
      toast.error('Name and Stream URL are required');
      return;
    }

    try {
      if (isEditing && channel) {
        await updateChannel.mutateAsync({
          id: channel.id,
          ...formData,
          drm_key_id: formData.drm_key_id || null,
          drm_key: formData.drm_key || null,
          license_type: formData.license_type || null,
          license_url: formData.license_url || null,
          user_agent: formData.user_agent || null,
          referrer: formData.referrer || null,
        });
        toast.success('Channel updated');
      } else {
        await createChannel.mutateAsync({
          ...formData,
          drm_key_id: formData.drm_key_id || null,
          drm_key: formData.drm_key || null,
          license_type: formData.license_type || null,
          license_url: formData.license_url || null,
          user_agent: formData.user_agent || null,
          referrer: formData.referrer || null,
        });
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

          {/* Stream URL */}
          <div className="space-y-2">
            <Label htmlFor="stream_url">Stream URL *</Label>
            <Input
              id="stream_url"
              value={formData.stream_url}
              onChange={(e) => {
                let url = e.target.value;
                // Auto-convert YouTube URLs when stream type is youtube
                if (formData.stream_type === 'youtube') {
                  url = convertToYouTubeEmbed(url);
                }
                setFormData({ ...formData, stream_url: url });
              }}
              placeholder={formData.stream_type === 'youtube' 
                ? "Paste any YouTube URL (auto-converts to embed)" 
                : "https://example.com/stream.m3u8"}
            />
            {formData.stream_type === 'youtube' && (
              <p className="text-xs text-muted-foreground">
                Supports: youtube.com/watch?v=..., youtu.be/..., youtube.com/live/...
              </p>
            )}
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
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
              
              {/* DRM Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="license_type">DRM Type</Label>
                <Select
                  value={formData.license_type || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, license_type: value === 'none' ? null : value as 'clearkey' | 'widevine' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select DRM type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No DRM</SelectItem>
                    <SelectItem value="clearkey">ClearKey</SelectItem>
                    <SelectItem value="widevine">Widevine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ClearKey Fields */}
              {formData.license_type === 'clearkey' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="drm_key_id">Key ID</Label>
                    <Input
                      id="drm_key_id"
                      value={formData.drm_key_id || ''}
                      onChange={(e) => setFormData({ ...formData, drm_key_id: e.target.value })}
                      placeholder="31363232353335323435353337353331"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drm_key">Key</Label>
                    <Input
                      id="drm_key"
                      value={formData.drm_key || ''}
                      onChange={(e) => setFormData({ ...formData, drm_key: e.target.value })}
                      placeholder="35416a68643065697575493337566135"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Widevine Fields */}
              {formData.license_type === 'widevine' && (
                <div className="space-y-2">
                  <Label htmlFor="license_url">Widevine License URL</Label>
                  <Input
                    id="license_url"
                    value={formData.license_url || ''}
                    onChange={(e) => setFormData({ ...formData, license_url: e.target.value })}
                    placeholder="https://license-server.com/license"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the Widevine license server URL
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Custom User Agent */}
          <div className="space-y-2">
            <Label htmlFor="user_agent">Custom User-Agent (Optional)</Label>
            <Input
              id="user_agent"
              value={formData.user_agent || ''}
              onChange={(e) => setFormData({ ...formData, user_agent: e.target.value })}
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Custom User-Agent header para sa stream requests. Iwanan kung default ang gagamitin.
            </p>
          </div>

          {/* Custom Referrer */}
          <div className="space-y-2">
            <Label htmlFor="referrer">Custom Referrer (Optional)</Label>
            <Input
              id="referrer"
              value={formData.referrer || ''}
              onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
              placeholder="https://example.com"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Custom Referer header para sa stream requests. Iwanan kung hindi kailangan.
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order ?? 0}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          {/* Proxy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="use_proxy">Use Cloudflare Proxy</Label>
              <p className="text-xs text-muted-foreground">Route stream through Cloudflare Worker proxy</p>
            </div>
            <Switch
              id="use_proxy"
              checked={formData.use_proxy ?? false}
              onCheckedChange={(checked) => setFormData({ ...formData, use_proxy: checked })}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">Channel will be visible to users</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
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
