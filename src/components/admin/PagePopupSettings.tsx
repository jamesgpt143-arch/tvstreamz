import { usePagePopupsAdmin } from '@/hooks/usePagePopup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export function PagePopupSettings() {
  const {
    popups,
    availablePages,
    isLoading,
    isSaving,
    updatePopup,
    savePopups,
  } = usePagePopupsAdmin();

  const handleSave = async () => {
    const result = await savePopups();
    if (result.success) {
      toast.success('Page popup settings saved!');
    } else {
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Page Popup Settings
        </CardTitle>
        <CardDescription>
          Configure popup URLs for different pages. When enabled, a new tab will open when users visit the page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availablePages.map(page => {
          const config = popups[page.id] || { enabled: false, url: '' };
          
          return (
            <div 
              key={page.id}
              className="p-4 rounded-lg border border-border bg-muted/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{page.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    /{page.id === 'home' ? '' : page.id}
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => updatePopup(page.id, { enabled: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`url-${page.id}`}>Popup URL</Label>
                <Input
                  id={`url-${page.id}`}
                  placeholder="https://example.com/promo"
                  value={config.url}
                  onChange={(e) => updatePopup(page.id, { url: e.target.value })}
                  disabled={!config.enabled}
                  className={!config.enabled ? 'opacity-50' : ''}
                />
              </div>
            </div>
          );
        })}

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
