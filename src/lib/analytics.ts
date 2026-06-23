

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

export const trackPageView = async (pagePath: string) => {
  try {
    const visitorId = getVisitorId();
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        page_path: pagePath,
        visitor_id: visitorId,
      })
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

export const trackContentView = async (
  contentId: string,
  contentType: string,
  contentTitle: string
) => {
  try {
    const visitorId = getVisitorId();
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'content_view',
        page_path: `/watch/${contentType}/${contentId}`,
        content_id: contentId,
        content_type: contentType,
        content_title: contentTitle,
        visitor_id: visitorId,
      })
    });
  } catch (error) {
    console.error('Failed to track content view:', error);
  }
};

export const trackPopAdsImpression = async () => {
  try {
    const visitorId = getVisitorId();
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'popads_impression',
        page_path: window.location.pathname,
        visitor_id: visitorId,
      })
    });
  } catch (error) {
    console.error('Failed to track PopAds impression:', error);
  }
};

export const trackPopAdsClick = async (source: string) => {
  try {
    const visitorId = getVisitorId();
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'popads_click',
        page_path: window.location.pathname,
        content_type: 'popads',
        content_title: source,
        visitor_id: visitorId,
      })
    });
  } catch (error) {
    console.error('Failed to track PopAds click:', error);
  }
};

export const getAnalyticsStats = async () => {
  try {
    const res = await fetch('/api/analytics');
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to fetch analytics');
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
