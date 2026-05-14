-- Create community_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    parent_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE,
    reply_to_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_watch_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_watch_history (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    progress NUMERIC DEFAULT 0,
    "current_time" NUMERIC DEFAULT 0,
    duration NUMERIC DEFAULT 0,
    season INTEGER,
    episode INTEGER,
    last_server TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, content_id, content_type)
);

-- Create user_my_list table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_my_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'tv', 'channel')),
    title TEXT NOT NULL,
    poster_path TEXT,
    vote_average NUMERIC,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, content_id, content_type)
);

-- Create custom_channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.custom_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stream_url TEXT NOT NULL,
    logo_url TEXT,
    stream_type TEXT,
    proxy_type TEXT,
    drm_key TEXT,
    drm_key_id TEXT,
    license_type TEXT,
    license_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    my_list JSONB DEFAULT '[]'::jsonb,
    watch_history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create user_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,
    channel_id TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables if not already enabled
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_my_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Safety blocks to create policies if they don't already exist
DO $$
BEGIN
    -- community_messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Anyone can view community messages') THEN
        CREATE POLICY "Anyone can view community messages" ON public.community_messages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Authenticated users can insert community messages') THEN
        CREATE POLICY "Authenticated users can insert community messages" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Users can delete their own community messages, or admins') THEN
        CREATE POLICY "Users can delete their own community messages, or admins" ON public.community_messages FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
    END IF;

    -- user_watch_history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_watch_history' AND policyname = 'Users can view their own watch history') THEN
        CREATE POLICY "Users can view their own watch history" ON public.user_watch_history FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_watch_history' AND policyname = 'Users can insert their own watch history') THEN
        CREATE POLICY "Users can insert their own watch history" ON public.user_watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_watch_history' AND policyname = 'Users can update their own watch history') THEN
        CREATE POLICY "Users can update their own watch history" ON public.user_watch_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_watch_history' AND policyname = 'Users can delete their own watch history') THEN
        CREATE POLICY "Users can delete their own watch history" ON public.user_watch_history FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- user_my_list policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_my_list' AND policyname = 'Users can view their own my_list') THEN
        CREATE POLICY "Users can view their own my_list" ON public.user_my_list FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_my_list' AND policyname = 'Users can insert their own my_list') THEN
        CREATE POLICY "Users can insert their own my_list" ON public.user_my_list FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_my_list' AND policyname = 'Users can delete their own my_list') THEN
        CREATE POLICY "Users can delete their own my_list" ON public.user_my_list FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- custom_channels policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_channels' AND policyname = 'Users can view their own custom channels') THEN
        CREATE POLICY "Users can view their own custom channels" ON public.custom_channels FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_channels' AND policyname = 'Users can insert their own custom channels') THEN
        CREATE POLICY "Users can insert their own custom channels" ON public.custom_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_channels' AND policyname = 'Users can update their own custom channels') THEN
        CREATE POLICY "Users can update their own custom channels" ON public.custom_channels FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_channels' AND policyname = 'Users can delete their own custom channels') THEN
        CREATE POLICY "Users can delete their own custom channels" ON public.custom_channels FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- user_preferences policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences') THEN
        CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences') THEN
        CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences') THEN
        CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;

    -- user_requests policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_requests' AND policyname = 'Users can view their own requests') THEN
        CREATE POLICY "Users can view their own requests" ON public.user_requests FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_requests' AND policyname = 'Admins can view all requests') THEN
        CREATE POLICY "Admins can view all requests" ON public.user_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_requests' AND policyname = 'Authenticated users can insert requests') THEN
        CREATE POLICY "Authenticated users can insert requests" ON public.user_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_requests' AND policyname = 'Admins can delete any requests') THEN
        CREATE POLICY "Admins can delete any requests" ON public.user_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Enable Realtime publication for community_messages so chats load instantly without refreshing
alter publication supabase_realtime add table community_messages;
