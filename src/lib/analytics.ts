import { supabase } from "@/integrations/supabase/client";

// Generate or get visitor ID from localStorage
const getVisitorId = (): string => {
  const key = 'tvstreamz_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

// Track a page view
export const trackPageView = async (pagePath: string) => {
  try {
    const visitorId = getVisitorId();
    await supabase.from('site_analytics').insert({
      event_type: 'page_view',
      page_path: pagePath,
      visitor_id: visitorId,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

// Track content view (movie, tv show, etc.)
export const trackContentView = async (
  contentId: string,
  contentType: string,
  contentTitle: string
) => {
  try {
    const visitorId = getVisitorId();
    await supabase.from('site_analytics').insert({
      event_type: 'content_view',
      page_path: `/watch/${contentType}/${contentId}`,
      content_id: contentId,
      content_type: contentType,
      content_title: contentTitle,
      visitor_id: visitorId,
    });
  } catch (error) {
    console.error('Failed to track content view:', error);
  }
};

// Get analytics stats
export const getAnalyticsStats = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total page views
    const { count: totalViews } = await supabase
      .from('site_analytics')
      .select('*', { count: 'exact', head: true });

    // Today's views
    const { count: todayViews } = await supabase
      .from('site_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Unique visitors (all time)
    const { data: allVisitors } = await supabase
      .from('site_analytics')
      .select('visitor_id');
    const uniqueVisitors = new Set(allVisitors?.map(v => v.visitor_id)).size;

    // This week's visitors
    const { data: weekVisitors } = await supabase
      .from('site_analytics')
      .select('visitor_id')
      .gte('created_at', thisWeek.toISOString());
    const weeklyVisitors = new Set(weekVisitors?.map(v => v.visitor_id)).size;

    // Popular content
    const { data: popularContent } = await supabase
      .from('site_analytics')
      .select('content_title, content_type, content_id')
      .not('content_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // Count content views
    const contentCounts: Record<string, { title: string; type: string; id: string; count: number }> = {};
    popularContent?.forEach(item => {
      if (item.content_id && item.content_title) {
        const key = `${item.content_type}-${item.content_id}`;
        if (!contentCounts[key]) {
          contentCounts[key] = {
            title: item.content_title,
            type: item.content_type || 'movie',
            id: item.content_id,
            count: 0,
          };
        }
        contentCounts[key].count++;
      }
    });

    const topContent = Object.values(contentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalViews: totalViews || 0,
      todayViews: todayViews || 0,
      uniqueVisitors,
      weeklyVisitors,
      topContent,
    };
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return {
      totalViews: 0,
      todayViews: 0,
      uniqueVisitors: 0,
      weeklyVisitors: 0,
      topContent: [],
    };
  }
};
