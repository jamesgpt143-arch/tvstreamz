-- Fix content_id type to support strings (for channel UUIDs) and update content_type constraint
-- We use DO blocks to safely handle tables that might or might not have these specific constraints

DO $$ 
BEGIN
    -- Update watchlist table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'watchlist') THEN
        -- Alter content_id to TEXT
        ALTER TABLE public.watchlist ALTER COLUMN content_id TYPE TEXT;
        
        -- Update content_type constraint
        ALTER TABLE public.watchlist DROP CONSTRAINT IF EXISTS watchlist_content_type_check;
        ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_content_type_check 
            CHECK (content_type IN ('movie', 'tv', 'channel'));
    END IF;

    -- Update user_my_list table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_my_list') THEN
        -- Alter content_id to TEXT
        ALTER TABLE public.user_my_list ALTER COLUMN content_id TYPE TEXT;
        
        -- Update content_type constraint
        ALTER TABLE public.user_my_list DROP CONSTRAINT IF EXISTS user_my_list_content_type_check;
        ALTER TABLE public.user_my_list ADD CONSTRAINT user_my_list_content_type_check 
            CHECK (content_type IN ('movie', 'tv', 'channel'));
    END IF;
END $$;
