import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '@/lib/version'; // <--- ITO YUNG NAGCO-CONNECT SA VERSION MO

export const UpdatePrompt = () => {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // KUNG HINDI NAKA-APK (PWA/Website lang), WAG NANG ILABAS ANG POPUP
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const checkUpdate = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'app_update')
          .maybeSingle();

        if (data?.value) {
          const config = data.value as any;
          // GAGAMITIN NA NIYA YUNG APP_VERSION MULA SA version.ts
          if (config.latest_version && config.latest_version !== APP_VERSION) {
            setUpdateInfo(config);
            setShowPrompt(true);
          }
        }
      } catch (error) {
        console.error("Failed to check for updates", error);
      }
    };

    checkUpdate();
  }, []);

  if (!showPrompt || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="bg-primary/10 p-6 flex flex-col items-center justify-center border-b border-border relative">
          {!updateInfo.force_update && (
            <button onClick={() => setShowPrompt(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Rocket className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-center">New App Update!</h2>
          <span className="text-sm font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-2">
            Version {updateInfo.latest_version}
          </span>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4 text-center whitespace-pre-wrap">
            {updateInfo.release_notes || "May bagong version ang TVStreamz! I-download ito ngayon para sa mas mabilis at mas magandang experience."}
          </p>
          
          <Button 
            className="w-full gap-2 text-md h-12" 
            onClick={() => window.open(updateInfo.download_url, '_blank')}
          >
            <Download className="w-5 h-5" />
            Download Update
          </Button>

          {updateInfo.force_update && (
            <p className="text-xs text-center text-destructive mt-3 font-medium">
              * Required ang update na ito para magamit ang app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
