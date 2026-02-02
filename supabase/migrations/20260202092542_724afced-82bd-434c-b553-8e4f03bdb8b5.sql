-- Create a function to get daily analytics stats (aggregated)
CREATE OR REPLACE FUNCTION get_daily_analytics_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  stat_date date,
  view_count bigint,
  visitor_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(created_at) as stat_date,
    COUNT(*) as view_count,
    COUNT(DISTINCT visitor_id) as visitor_count
  FROM site_analytics
  WHERE created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY DATE(created_at)
  ORDER BY stat_date ASC;
$$;