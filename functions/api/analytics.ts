export const onRequestGet = async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'live_channel') {
      const results = await env.DB.prepare(`
        SELECT content_id, count(*) as views
        FROM site_analytics
        WHERE content_type = 'live_channel' AND content_id IS NOT NULL
        GROUP BY content_id
      `).all();
      
      const viewCounts = {};
      results.results.forEach((row) => {
        viewCounts[row.content_id] = row.views;
      });
      return new Response(JSON.stringify(viewCounts), { headers: { 'Content-Type': 'application/json' } });
    }

    const totalViews = await env.DB.prepare("SELECT count(*) as count FROM site_analytics WHERE event_type = 'page_view'").first('count');
    const todayViews = await env.DB.prepare("SELECT count(*) as count FROM site_analytics WHERE event_type = 'page_view' AND created_at >= date('now', 'start of day')").first('count');
    
    const uniqueVisitorsResult = await env.DB.prepare("SELECT count(DISTINCT visitor_id) as count FROM site_analytics").first('count');
    const weeklyVisitorsResult = await env.DB.prepare("SELECT count(DISTINCT visitor_id) as count FROM site_analytics WHERE created_at >= date('now', '-7 days')").first('count');

    const topContentResult = await env.DB.prepare(`
      SELECT content_title as title, content_type as type, content_id as id, count(*) as count
      FROM site_analytics 
      WHERE content_id IS NOT NULL AND content_title IS NOT NULL
      GROUP BY content_id, content_type, content_title
      ORDER BY count DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      totalViews: totalViews || 0,
      todayViews: todayViews || 0,
      uniqueVisitors: uniqueVisitorsResult || 0,
      weeklyVisitors: weeklyVisitorsResult || 0,
      topContent: topContentResult.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { event_type, page_path, content_id, content_type, content_title, visitor_id } = body;

    await env.DB.prepare(
      `INSERT INTO site_analytics (event_type, page_path, content_id, content_type, content_title, visitor_id) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      event_type || 'page_view', 
      page_path || null, 
      content_id || null, 
      content_type || null, 
      content_title || null, 
      visitor_id || 'unknown'
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
