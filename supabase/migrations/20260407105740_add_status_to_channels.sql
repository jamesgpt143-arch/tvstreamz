ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'online';
COMMENT ON COLUMN public.channels.status IS 'Current status of the channel: online or offline';
