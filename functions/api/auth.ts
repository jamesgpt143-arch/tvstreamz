const textEncoder = new TextEncoder();

async function signToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(`${header}.${body}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${body}.${signature}`;
}

async function verifyToken(token, secret) {
  const [header, body, signature] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  let base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const sigBytes = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));

  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(`${header}.${body}`));
  if (!isValid) throw new Error('Invalid token');
  
  return JSON.parse(atob(body));
}

const getSecretKey = (env) => env.JWT_SECRET || 'default_fallback_secret_please_change';

export const onRequestGet = async (context) => {
  const { request, env } = context;
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ isAdmin: false }));

    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['admin_token'];
    
    if (!token) return new Response(JSON.stringify({ isAdmin: false }));

    const payload = await verifyToken(token, getSecretKey(env));
    if (payload.role === 'admin') {
      return new Response(JSON.stringify({ isAdmin: true, user: payload }));
    }
  } catch (e) {
    // invalid token
  }
  return new Response(JSON.stringify({ isAdmin: false }));
};

export const onRequestPost = async (context) => {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    const { results } = await env.DB.prepare('SELECT * FROM users WHERE username = ? LIMIT 1').bind(username).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const user = results[0];
    
    if (user.password_hash !== password) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const token = await signToken({ id: user.id, username: user.username, role: user.role, exp: Date.now() + 86400000 }, getSecretKey(env));

    return new Response(JSON.stringify({ success: true, token }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
