import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  og_image: string;
}

export function SEOManager() {
  const [settings, setSettings] = useState<SEOSettings | null>(null);

  useEffect(() => {
    fetchSEO();
  }, []);

  const fetchSEO = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "seo_settings")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        const val = data.value as unknown as SEOSettings;
        setSettings(val);
        applySEO(val);
      }
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    }
  };

  const applySEO = (s: SEOSettings) => {
    // 1. Update document title
    if (s.title) {
        document.title = s.title;
    }

    // 2. Update meta tags
    updateMetaTag("description", s.description);
    updateMetaTag("keywords", s.keywords);
    
    // OG Tags
    updateMetaTag("og:title", s.title, "property");
    updateMetaTag("og:description", s.description, "property");
    updateMetaTag("og:image", s.og_image, "property");
  };

  const updateMetaTag = (name: string, content: string, attribute = "name") => {
    if (!content) return;
    
    let tag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  return null; // This component doesn't render anything UI-wise
}
