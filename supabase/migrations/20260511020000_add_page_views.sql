-- Migration: Page view tracking table
CREATE TABLE IF NOT EXISTS public.page_views (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id   TEXT,        -- same visitor_id used in agent_conversations
    referrer     TEXT,        -- document.referrer
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-owner queries
CREATE INDEX IF NOT EXISTS idx_page_views_owner ON public.page_views (page_owner_id, created_at DESC);

-- RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public tracking)
DROP POLICY IF EXISTS "Public can insert page views" ON public.page_views;
CREATE POLICY "Public can insert page views" ON public.page_views
FOR INSERT WITH CHECK (true);

-- Only the owner can read their own views
DROP POLICY IF EXISTS "Owners can read their own page views" ON public.page_views;
CREATE POLICY "Owners can read their own page views" ON public.page_views
FOR SELECT USING (auth.uid() = page_owner_id);
