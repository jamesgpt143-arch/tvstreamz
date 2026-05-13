-- Add EPG and channel number columns to public.channels table
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS epg_id TEXT DEFAULT NULL;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS channel_num TEXT DEFAULT NULL;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS epg_url TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.channels.epg_id IS 'EPG ID / Name used to map channel to electronic program guide data';
COMMENT ON COLUMN public.channels.channel_num IS 'Logical channel number displayed in the client UI';
COMMENT ON COLUMN public.channels.epg_url IS 'External XMLTV EPG URL for manual channel listings';
