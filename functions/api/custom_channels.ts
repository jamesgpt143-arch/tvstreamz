export const onRequestGet = async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`SELECT * FROM custom_channels ORDER BY created_at DESC`).all();
    return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestPost = async (context) => {
  const { request, env } = context;
  try {
    const data = await request.json();
    
    // Check if it's an update or insert based on ID
    if (data.id) {
      await env.DB.prepare(`
        UPDATE custom_channels SET 
          name = ?, stream_url = ?, logo_url = ?, stream_type = ?, 
          drm_key_id = ?, drm_key = ?, license_type = ?, license_url = ?, proxy_type = ?
        WHERE id = ?
      `).bind(
        data.name, data.stream_url, data.logo_url, data.stream_type,
        data.drm_key_id, data.drm_key, data.license_type, data.license_url, data.proxy_type,
        data.id
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO custom_channels (id, name, stream_url, logo_url, stream_type, drm_key_id, drm_key, license_type, license_url, proxy_type, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), data.name, data.stream_url, data.logo_url, data.stream_type,
        data.drm_key_id, data.drm_key, data.license_type, data.license_url, data.proxy_type, 'admin'
      ).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestDelete = async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    await env.DB.prepare('DELETE FROM custom_channels WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
