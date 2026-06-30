var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/analytics.ts
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    if (type === "live_channel") {
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
      return new Response(JSON.stringify(viewCounts), { headers: { "Content-Type": "application/json" } });
    }
    const totalViews = await env.DB.prepare("SELECT count(*) as count FROM site_analytics WHERE event_type = 'page_view'").first("count");
    const todayViews = await env.DB.prepare("SELECT count(*) as count FROM site_analytics WHERE event_type = 'page_view' AND created_at >= date('now', 'start of day')").first("count");
    const uniqueVisitorsResult = await env.DB.prepare("SELECT count(DISTINCT visitor_id) as count FROM site_analytics").first("count");
    const weeklyVisitorsResult = await env.DB.prepare("SELECT count(DISTINCT visitor_id) as count FROM site_analytics WHERE created_at >= date('now', '-7 days')").first("count");
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
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { event_type, page_path, content_id, content_type, content_title, visitor_id } = body;
    await env.DB.prepare(
      `INSERT INTO site_analytics (event_type, page_path, content_id, content_type, content_title, visitor_id) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      event_type || "page_view",
      page_path || null,
      content_id || null,
      content_type || null,
      content_title || null,
      visitor_id || "unknown"
    ).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");

// api/auth.ts
var textEncoder = new TextEncoder();
async function signToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, textEncoder.encode(`${header}.${body}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${header}.${body}.${signature}`;
}
__name(signToken, "signToken");
async function verifyToken(token, secret) {
  const [header, body, signature] = token.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const sigBytes = new Uint8Array(atob(base64).split("").map((c) => c.charCodeAt(0)));
  const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, textEncoder.encode(`${header}.${body}`));
  if (!isValid) throw new Error("Invalid token");
  return JSON.parse(atob(body));
}
__name(verifyToken, "verifyToken");
var getSecretKey = /* @__PURE__ */ __name((env) => env.JWT_SECRET || "default_fallback_secret_please_change", "getSecretKey");
var onRequestGet2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return new Response(JSON.stringify({ isAdmin: false }));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const token = cookies["admin_token"];
    if (!token) return new Response(JSON.stringify({ isAdmin: false }));
    const payload = await verifyToken(token, getSecretKey(env));
    if (payload.role === "admin") {
      return new Response(JSON.stringify({ isAdmin: true, user: payload }));
    }
  } catch (e) {
  }
  return new Response(JSON.stringify({ isAdmin: false }));
}, "onRequestGet");
var onRequestPost2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const { username, password } = await request.json();
    const { results } = await env.DB.prepare("SELECT * FROM users WHERE username = ? LIMIT 1").bind(username).all();
    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    const user = results[0];
    if (user.password_hash !== password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    const token = await signToken({ id: user.id, username: user.username, role: user.role, exp: Date.now() + 864e5 }, getSecretKey(env));
    return new Response(JSON.stringify({ success: true, token }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");

// api/channels.ts
var onRequestGet3 = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    let query = "SELECT * FROM channels";
    if (!includeInactive) {
      query += " WHERE is_active = 1";
    }
    query += " ORDER BY sort_order ASC, name ASC";
    const { results } = await env.DB.prepare(query).all();
    const channels = results.map((ch) => ({
      ...ch,
      is_active: ch.is_active === 1,
      use_proxy: ch.use_proxy === 1,
      proxy_order: ch.proxy_order ? JSON.parse(ch.proxy_order) : null
    }));
    return new Response(JSON.stringify(channels), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name(async (context) => {
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
      id,
      body.name,
      body.stream_url,
      body.stream_type,
      body.category || null,
      body.logo_url || null,
      body.drm_key_id || null,
      body.drm_key || null,
      body.license_type || null,
      body.license_url || null,
      is_active,
      body.sort_order || 0,
      body.user_agent || null,
      body.referrer || null,
      use_proxy,
      proxy_order,
      body.tvapp_slug || null,
      body.proxy_type || "none",
      body.epg_id || null,
      body.channel_num || null,
      body.epg_url || null
    ).run();
    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
    }
    await env.DB.prepare("DELETE FROM channels WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestDelete");

// api/chat.ts
var onRequestPost4 = /* @__PURE__ */ __name(async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const formattedMessages = body.messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: typeof msg.content === "string" ? msg.content : msg.content[0]?.text || ""
    }));
    const apiMessages = [
      { role: "system", content: "You are Streamz AI, a helpful assistant for TVStreamz. Answer in Tagalog if spoken to in Tagalog." },
      ...formattedMessages
    ];
    const response = await env.AI.run("@cf/google/gemma-7b-it-lora", {
      messages: apiMessages
    });
    const formattedResponse = {
      content: [
        { text: response.response }
      ]
    };
    return new Response(JSON.stringify(formattedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/custom_channels.ts
var onRequestGet4 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`SELECT * FROM custom_channels ORDER BY created_at DESC`).all();
    return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost5 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (data.id) {
      await env.DB.prepare(`
        UPDATE custom_channels SET 
          name = ?, stream_url = ?, logo_url = ?, stream_type = ?, 
          drm_key_id = ?, drm_key = ?, license_type = ?, license_url = ?, proxy_type = ?
        WHERE id = ?
      `).bind(
        data.name,
        data.stream_url,
        data.logo_url,
        data.stream_type,
        data.drm_key_id,
        data.drm_key,
        data.license_type,
        data.license_url,
        data.proxy_type,
        data.id
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO custom_channels (id, name, stream_url, logo_url, stream_type, drm_key_id, drm_key, license_type, license_url, proxy_type, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        data.name,
        data.stream_url,
        data.logo_url,
        data.stream_type,
        data.drm_key_id,
        data.drm_key,
        data.license_type,
        data.license_url,
        data.proxy_type,
        "admin"
      ).run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");
var onRequestDelete2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    await env.DB.prepare("DELETE FROM custom_channels WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestDelete");

// api/messages.ts
var onRequestGet5 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM user_requests 
      ORDER BY created_at DESC
    `).all();
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost6 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return new Response(JSON.stringify({ error: "ID and status required" }), { status: 400 });
    }
    await env.DB.prepare(
      `UPDATE user_requests SET status = ? WHERE id = ?`
    ).bind(status, id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");
var onRequestDelete3 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    await env.DB.prepare("DELETE FROM user_requests WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestDelete");

// api/notifications.ts
var onRequestGet6 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();
    return new Response(JSON.stringify(results.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost7 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const { title, message } = await request.json();
    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message required" }), { status: 400 });
    }
    await env.DB.prepare(
      `INSERT INTO notifications (id, title, message, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(crypto.randomUUID(), title, message).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");
var onRequestDelete4 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    await env.DB.prepare("DELETE FROM notifications WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestDelete");

// api/settings.ts
var onRequestGet7 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT key, value FROM site_settings").all();
    const settings = {};
    for (const row of results) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    }
    return new Response(JSON.stringify(settings), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost8 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key || value === void 0) {
      return new Response(JSON.stringify({ error: "Missing key or value" }), { status: 400 });
    }
    const valueStr = typeof value === "object" ? JSON.stringify(value) : value;
    await env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP) 
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`
    ).bind(key, valueStr).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}, "onRequestPost");

// api/_middleware.ts
var onRequest = /* @__PURE__ */ __name(async ({ request, next }) => {
  const response = await next();
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const newResponse = new Response(response.body, response);
  Object.keys(corsHeaders).forEach((key) => {
    newResponse.headers.set(key, corsHeaders[key]);
  });
  return newResponse;
}, "onRequest");

// ../.wrangler/tmp/pages-z30BCJ/functionsRoutes-0.09530639431168808.mjs
var routes = [
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/channels",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/channels",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/channels",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/custom_channels",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/custom_channels",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/custom_channels",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete3]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete4]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// C:/Users/flame143/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/flame143/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
