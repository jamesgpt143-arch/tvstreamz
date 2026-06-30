CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  content_id TEXT,
  content_type TEXT,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_channels (
  id TEXT PRIMARY KEY,
  name TEXT,
  stream_url TEXT,
  logo_url TEXT,
  stream_type TEXT,
  drm_key_id TEXT,
  drm_key TEXT,
  license_type TEXT,
  license_url TEXT,
  proxy_type TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT,
  link_url TEXT,
  link_text TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT,
  stream_url TEXT,
  logo_url TEXT,
  stream_type TEXT,
  drm_key_id TEXT,
  drm_key TEXT,
  license_type TEXT,
  license_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER,
  user_agent TEXT,
  referrer TEXT,
  use_proxy BOOLEAN DEFAULT 0,
  proxy_order TEXT,
  tvapp_slug TEXT,
  proxy_type TEXT,
  epg_id TEXT,
  channel_num TEXT,
  epg_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_requests (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES ('admin_1', 'admin', 'darman18', 'admin');

-- Insert Settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('page_popups', '{"enabled":true,"url":"https://shope.ee/sample","timeout":5000,"openNewTab":true,"clicksBeforePopup":3}');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('maintenance_mode', '{"enabled":false,"message":"We are updating the site."}');
