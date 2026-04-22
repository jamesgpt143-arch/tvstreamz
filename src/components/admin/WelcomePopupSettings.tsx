import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/integrations/supabase/types';

interface WelcomePopupData {
  enabled: boolean;
  emoji: string;
  title: string;
  message: string;
  button_text: string;
  tags: string[];
  link_url?: string;
  link_text?: string;
}

const defaultData: WelcomePopupData = {
  enabled: true,
  emoji: '🎬',
  title: 'Welcome to TVStreamz!',
  message: 'Stream your favorite movies, TV shows, anime, and live TV channels for free. Enjoy unlimited entertainment anytime, anywhere!',
  button_text: 'Start Watching 🍿',
  tags: ['Movies', 'TV Shows', 'Anime', 'Live TV'],
  link_url: '',
  link_text: ''
};

export const WelcomePopupSettings = () => {
  const [data, setData] = useState<WelcomePopupData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'welcome_popup')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settings?.value) {
        setData({ ...defaultData, ...(settings.value as unknown as WelcomePopupData) });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: data as unknown as Json
        })
        .eq('key', 'welcome_popup');

      if (error) throw error;
      toast.success('Welcome popup settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      setData({ ...data, tags: [...data.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setData({ ...data, tags: data.tags.filter(tag => tag !== tagToRemove) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Popup Settings</CardTitle>
        <CardDescription>
          Customize the welcome popup that appears when users first visit the site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled">Enable Welcome Popup</Label>
            <p className="text-sm text-muted-foreground">Show popup on first visit</p>
          </div>
          <Switch
            id="enabled"
            checked={data.enabled}
            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
          />
        </div>

        {/* Emoji */}
        <div className="space-y-2">
          <Label htmlFor="emoji">Emoji Icon</Label>
          <Input
            id="emoji"
            value={data.emoji}
            onChange={(e) => setData({ ...data, emoji: e.target.value })}
            placeholder="🎬"
            className="w-24 text-2xl text-center"
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="Welcome to TVStreamz!"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={data.message}
            onChange={(e) => setData({ ...data, message: e.target.value })}
            placeholder="Your welcome message..."
            rows={3}
          />
        </div>

        {/* Optional Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
          <div className="space-y-2">
            <Label htmlFor="link_text">Link Display Text (Optional)</Label>
            <Input
              id="link_text"
              value={data.link_text || ''}
              onChange={(e) => setData({ ...data, link_text: e.target.value })}
              placeholder="e.g. Join our Telegram Group"
            />
            <p className="text-[10px] text-muted-foreground">Ito ang text na makikita at iki-click ng user.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link_url">Link URL (Optional)</Label>
            <Input
              id="link_url"
              value={data.link_url || ''}
              onChange={(e) => setData({ ...data, link_url: e.target.value })}
              placeholder="https://t.me/yourgroup"
            />
            <p className="text-[10px] text-muted-foreground">Ang website address kung saan sila mapupunta.</p>
          </div>
        </div>

        {/* Button Text */}
        <div className="space-y-2">
          <Label htmlFor="button_text">Button Text</Label>
          <Input
            id="button_text"
            value={data.button_text}
            onChange={(e) => setData({ ...data, button_text: e.target.value })}
            placeholder="Start Watching 🍿"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add new tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-center space-y-4">
              <div className="text-5xl">{data.emoji}</div>
              <h3 className="text-2xl font-bold">{data.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.message}</p>
              
              {/* Link Preview */}
              {data.link_text && data.link_url && (
                <a href={data.link_url} target="_blank" rel="noopener noreferrer" className="inline-block text-primary hover:text-primary/80 font-medium underline underline-offset-4 text-sm transition-colors mt-2">
                  {data.link_text}
                </a>
              )}

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {data.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary">
                    {tag}
                  </span>
                ))}
              </div>
              <Button className="w-full mt-4">{data.button_text}</Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
