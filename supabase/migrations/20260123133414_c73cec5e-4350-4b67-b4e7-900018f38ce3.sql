-- Create site_settings table for customizable content
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default welcome popup settings
INSERT INTO public.site_settings (key, value)
VALUES ('welcome_popup', '{
  "enabled": true,
  "emoji": "🎬",
  "title": "Welcome to TVStreamz!",
  "message": "Stream your favorite movies, TV shows, anime, and live TV channels for free. Enjoy unlimited entertainment anytime, anywhere!",
  "button_text": "Start Watching 🍿",
  "tags": ["Movies", "TV Shows", "Anime", "Live TV"]
}'::jsonb);