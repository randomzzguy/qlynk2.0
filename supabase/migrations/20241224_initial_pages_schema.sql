-- Master Schema: Create public page infrastructure
-- This ensures the pages, social_links, and custom_links tables exist and are publicly readable.

-- Core account tables are included here so a fresh migration reset does not
-- depend on tables that were previously created only through the dashboard.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name TEXT DEFAULT 'Your AI',
    agent_avatar TEXT,
    welcome_message TEXT,
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '[]'::jsonb,
    custom_knowledge TEXT,
    primary_color TEXT DEFAULT '#f46530',
    position TEXT DEFAULT 'bottom-right',
    is_enabled BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    tone TEXT DEFAULT 'professional',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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
