export const onRequestGet = async (context) => {
  const { env } = context;
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();

    return new Response(JSON.stringify(results.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestPost = async (context) => {
  const { request, env } = context;
  try {
    const { title, message } = await request.json();
    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message required' }), { status: 400 });
    }

    await env.DB.prepare(
      `INSERT INTO notifications (id, title, message, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(crypto.randomUUID(), title, message).run();

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

    await env.DB.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
