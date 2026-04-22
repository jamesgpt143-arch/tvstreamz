-- Create channels table for Live TV management
CREATE TABLE public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  stream_url text NOT NULL,
  stream_type text NOT NULL DEFAULT 'hls',
  drm_key_id text,
  drm_key text,
  category text DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active channels
CREATE POLICY "Anyone can view active channels" 
ON public.channels 
FOR SELECT 
USING (is_active = true);

-- Policy: Admins can view all channels (including inactive)
CREATE POLICY "Admins can view all channels" 
ON public.channels 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert channels
CREATE POLICY "Admins can insert channels" 
ON public.channels 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update channels
CREATE POLICY "Admins can update channels" 
ON public.channels 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete channels
CREATE POLICY "Admins can delete channels" 
ON public.channels 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_channels_updated_at
BEFORE UPDATE ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();