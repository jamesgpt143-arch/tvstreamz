import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Megaphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnnouncementSettings {
  is_active: boolean;
  message: string;
  bgColor: string;
  textColor: string;
  link?: string;
}

export function AnnouncementBar() {
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "announcement_settings")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        const val = data.value as unknown as AnnouncementSettings;
        setSettings(val);
        // Check if user dismissed it in this session
        const dismissed = sessionStorage.getItem("announcement_dismissed");
        if (val.is_active && !dismissed) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("announcement_dismissed", "true");
  };

  if (!isVisible || !settings) return null;

  return (
    <div 
      className="w-full py-2.5 px-4 flex items-center justify-center relative z-[60] animate-in slide-in-from-top duration-500"
      style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
    >
      <div className="container mx-auto flex items-center justify-center gap-2 pr-8">
        <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
        <p className="text-sm font-medium text-center">
          {settings.message}
          {settings.link && (
            <a 
              href={settings.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 underline underline-offset-4 hover:opacity-80 inline-flex items-center gap-1"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 h-7 w-7 hover:bg-black/10 text-current"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
