-- Create user_playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create playlist_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.playlist_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT,
    group_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on the tables
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_favorites ENABLE ROW LEVEL SECURITY;

-- Safety blocks to create policies if they don't already exist
DO $$
BEGIN
    -- user_playlists policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Users can view their own playlists') THEN
        CREATE POLICY "Users can view their own playlists" ON public.user_playlists FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Users can insert their own playlists') THEN
        CREATE POLICY "Users can insert their own playlists" ON public.user_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Users can update their own playlists') THEN
        CREATE POLICY "Users can update their own playlists" ON public.user_playlists FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Users can delete their own playlists') THEN
        CREATE POLICY "Users can delete their own playlists" ON public.user_playlists FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- playlist_favorites policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_favorites' AND policyname = 'Users can view their own favorite playlists') THEN
        CREATE POLICY "Users can view their own favorite playlists" ON public.playlist_favorites FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_favorites' AND policyname = 'Users can insert their own favorite playlists') THEN
        CREATE POLICY "Users can insert their own favorite playlists" ON public.playlist_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_favorites' AND policyname = 'Users can update their own favorite playlists') THEN
        CREATE POLICY "Users can update their own favorite playlists" ON public.playlist_favorites FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_favorites' AND policyname = 'Users can delete their own favorite playlists') THEN
        CREATE POLICY "Users can delete their own favorite playlists" ON public.playlist_favorites FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
