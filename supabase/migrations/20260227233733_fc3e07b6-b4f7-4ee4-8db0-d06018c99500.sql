-- Fix overly permissive site_analytics INSERT policy
-- Replace WITH CHECK (true) with basic input validation
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.site_analytics;

CREATE POLICY "Anyone can insert analytics"
ON public.site_analytics
FOR INSERT
WITH CHECK (
  length(visitor_id) > 0 AND length(visitor_id) <= 100
  AND length(page_path) > 0 AND length(page_path) <= 500
  AND length(event_type) > 0 AND length(event_type) <= 50
  AND (content_id IS NULL OR length(content_id) <= 200)
  AND (content_type IS NULL OR length(content_type) <= 50)
  AND (content_title IS NULL OR length(content_title) <= 500)
);