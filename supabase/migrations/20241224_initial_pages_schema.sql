-- Master Schema: Create public page infrastructure
-- This ensures the pages, social_links, and custom_links tables exist and are publicly readable.

CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT,
    profession TEXT,
    tagline TEXT,
    bio TEXT,
    profile_image TEXT,
    theme TEXT DEFAULT 'quickpitch',
    theme_category TEXT DEFAULT 'freelancers',
    theme_data JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    platform TEXT,
    url TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    title TEXT,
    url TEXT,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security: Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

-- Policies: Public Read Access
DROP POLICY IF EXISTS "Allow public read for pages" ON public.pages;
CREATE POLICY "Allow public read for pages" ON public.pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read for social_links" ON public.social_links;
CREATE POLICY "Allow public read for social_links" ON public.social_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read for custom_links" ON public.custom_links;
CREATE POLICY "Allow public read for custom_links" ON public.custom_links FOR SELECT USING (true);

-- Policies: Owner Management
DROP POLICY IF EXISTS "Users can manage their own pages" ON public.pages;
CREATE POLICY "Users can manage their own pages" ON public.pages 
FOR ALL USING (auth.uid() = user_id);
