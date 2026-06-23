export const onRequestGet = async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
    
    // Convert array of {key, value} to an object
    const settings = {};
    for (const row of results) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    }

    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  // TODO: Add Auth verification here
  
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return new Response(JSON.stringify({ error: 'Missing key or value' }), { status: 400 });
    }

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;

    await env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP) 
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`
    ).bind(key, valueStr).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
