-- Profiles contain private account state. Public callers receive only the
-- identity fields required to resolve and render published pages.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone"
ON public.profiles;

DROP POLICY IF EXISTS "Users can manage their own profile"
ON public.profiles;

CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_barrier = true)
AS
SELECT id, username, full_name, avatar_url, created_at
FROM public.profiles;

REVOKE ALL ON public.profiles_public FROM PUBLIC;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Link rows are owned indirectly through their parent page.
DROP POLICY IF EXISTS "Users can manage links on their own pages"
ON public.social_links;
CREATE POLICY "Users can manage links on their own pages"
ON public.social_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = social_links.page_id
      AND pages.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = social_links.page_id
      AND pages.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage links on their own pages"
ON public.custom_links;
CREATE POLICY "Users can manage links on their own pages"
ON public.custom_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = custom_links.page_id
      AND pages.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = custom_links.page_id
      AND pages.user_id = auth.uid()
  )
);
