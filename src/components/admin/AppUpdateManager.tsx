import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Save, Loader2, AlertCircle } from 'lucide-react';

export const AppUpdateManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const [versionData, setVersionData] = useState({
    latest_version: '1.0.0',
    download_url: '',
    release_notes: '',
    force_update: false,
  });

  useEffect(() => {
    fetchUpdateSettings();
  }, []);

  const fetchUpdateSettings = async () => {
    setIsFetching(true);
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'app_update')
        .maybeSingle();

      if (data?.value) {
        setVersionData(data.value as any);
      }
    } catch (error) {
      console.error('Error fetching update settings:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'app_update', 
          value: versionData 
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: "Update Settings Saved!",
        description: "Makikita na ng mga users ang bagong update prompt.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hindi ma-save ang settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl mb-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="p-2 bg-primary/20 text-primary rounded-lg">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold">App Update Manager</h2>
          <p className="text-sm text-muted-foreground">Kontrolin ang lalabas na "New Update" popup sa mga users.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Latest Version Code</label>
            <Input 
              value={versionData.latest_version} 
              onChange={(e) => setVersionData({...versionData, latest_version: e.target.value})}
              placeholder="e.g. 1.0.1" 
            />
          </div>

          <div className="space-y-2 flex flex-col justify-end pb-1">
             <label className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded-md hover:bg-accent transition-colors">
              <input 
                type="checkbox" 
                checked={versionData.force_update}
                onChange={(e) => setVersionData({...versionData, force_update: e.target.checked})}
                className="w-5 h-5 accent-destructive cursor-pointer"
              />
              <span className="text-sm font-medium">Force Update (Bawal i-close)</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">APK Download Link</label>
          <Input 
            value={versionData.download_url} 
            onChange={(e) => setVersionData({...versionData, download_url: e.target.value})}
            placeholder="https://..." 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Release Notes (Ano ang bago?)</label>
          <Textarea 
            value={versionData.release_notes} 
            onChange={(e) => setVersionData({...versionData, release_notes: e.target.value})}
            placeholder="Added new Server 4, faster loading..." 
            className="h-24"
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isLoading ? 'Saving...' : 'Save Update Settings'}
        </Button>
      </div>
    </div>
  );
};
