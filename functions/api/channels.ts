export const onRequestGet = async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    let query = 'SELECT * FROM channels';
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC, name ASC';

    const { results } = await env.DB.prepare(query).all();

    // Convert boolean values correctly since SQLite returns 0/1
    const channels = results.map(ch => ({
      ...ch,
      is_active: ch.is_active === 1,
      use_proxy: ch.use_proxy === 1,
      proxy_order: ch.proxy_order ? JSON.parse(ch.proxy_order) : null
    }));

    return new Response(JSON.stringify(channels), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestPost = async (context) => {
  const { env, request } = context;
  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const is_active = body.is_active ? 1 : 0;
    const use_proxy = body.use_proxy ? 1 : 0;
    const proxy_order = body.proxy_order ? JSON.stringify(body.proxy_order) : null;

    await env.DB.prepare(
      `INSERT INTO channels (
        id, name, stream_url, stream_type, category, logo_url, 
        drm_key_id, drm_key, license_type, license_url, 
        is_active, sort_order, user_agent, referrer, 
        use_proxy, proxy_order, tvapp_slug, proxy_type, 
        epg_id, channel_num, epg_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?
      ) ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, stream_url=excluded.stream_url, stream_type=excluded.stream_type,
        category=excluded.category, logo_url=excluded.logo_url, drm_key_id=excluded.drm_key_id,
        drm_key=excluded.drm_key, license_type=excluded.license_type, license_url=excluded.license_url,
        is_active=excluded.is_active, sort_order=excluded.sort_order, user_agent=excluded.user_agent,
        referrer=excluded.referrer, use_proxy=excluded.use_proxy, proxy_order=excluded.proxy_order,
        tvapp_slug=excluded.tvapp_slug, proxy_type=excluded.proxy_type, epg_id=excluded.epg_id,
        channel_num=excluded.channel_num, epg_url=excluded.epg_url, updated_at=CURRENT_TIMESTAMP`
    ).bind(
      id, body.name, body.stream_url, body.stream_type, body.category || null, body.logo_url || null,
      body.drm_key_id || null, body.drm_key || null, body.license_type || null, body.license_url || null,
      is_active, body.sort_order || 0, body.user_agent || null, body.referrer || null,
      use_proxy, proxy_order, body.tvapp_slug || null, body.proxy_type || 'none',
      body.epg_id || null, body.channel_num || null, body.epg_url || null
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestDelete = async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    await env.DB.prepare('DELETE FROM channels WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
