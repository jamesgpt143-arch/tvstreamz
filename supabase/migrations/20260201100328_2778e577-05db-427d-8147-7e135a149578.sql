-- Add Widevine DRM support columns to channels table
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS license_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS license_url text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.channels.license_type IS 'DRM license type: clearkey, widevine, or null for no DRM';
COMMENT ON COLUMN public.channels.license_url IS 'License server URL for Widevine DRM';