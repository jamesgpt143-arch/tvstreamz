-- Insert default PopAds settings
INSERT INTO public.site_settings (key, value)
VALUES ('popads_settings', '{
  "enabled": true,
  "siteId": 4983507,
  "minBid": 0,
  "popundersPerIP": "0",
  "delayBetween": 0,
  "defaultPerDay": 0,
  "topmostLayer": "auto"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;