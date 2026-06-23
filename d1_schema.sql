-- D1 Schema for TVStreamz

DROP TABLE IF EXISTS site_settings;
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL, -- JSON stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default site_settings
INSERT INTO site_settings (key, value) VALUES
  ('page_popups', '{"home":{"enabled":false,"url":""},"livetv":{"enabled":false,"url":""},"anime":{"enabled":false,"url":""},"movies":{"enabled":false,"url":""},"tvshows":{"enabled":false,"url":""}}');

DROP TABLE IF EXISTS site_analytics;
CREATE TABLE site_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  page_path TEXT,
  content_id TEXT,
  content_type TEXT,
  content_title TEXT,
  visitor_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS channels;
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT NOT NULL,
  category TEXT,
  logo_url TEXT,
  drm_key_id TEXT,
  drm_key TEXT,
  license_type TEXT,
  license_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER,
  user_agent TEXT,
  referrer TEXT,
  use_proxy BOOLEAN DEFAULT 0,
  proxy_order TEXT,
  tvapp_slug TEXT,
  proxy_type TEXT DEFAULT 'none',
  epg_id TEXT,
  channel_num TEXT,
  epg_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
