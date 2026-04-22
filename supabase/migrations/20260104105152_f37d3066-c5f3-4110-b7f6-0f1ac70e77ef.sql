-- Create table for site analytics
CREATE TABLE public.site_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  page_path TEXT NOT NULL,
  content_id TEXT,
  content_type TEXT,
  content_title TEXT,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics (anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.site_analytics
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read aggregated analytics (for display)
CREATE POLICY "Anyone can read analytics"
ON public.site_analytics
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_analytics_created_at ON public.site_analytics(created_at);
CREATE INDEX idx_analytics_page_path ON public.site_analytics(page_path);
CREATE INDEX idx_analytics_content ON public.site_analytics(content_id, content_type);