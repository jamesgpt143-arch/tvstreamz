UPDATE channels 
SET stream_url = 'https://wmjebiejrjgfafsniqlx.supabase.co/functions/v1/stream-proxy?url=http://trilo.tv/live/Eden1/123456789/368076.m3u8',
    updated_at = now()
WHERE id = '3cf4c259-2931-4ee5-92dc-4939099bbf2b';