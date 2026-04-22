
CREATE TABLE public.tvapp_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  resolved_url text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tvapp_cache DISABLE ROW LEVEL SECURITY;
