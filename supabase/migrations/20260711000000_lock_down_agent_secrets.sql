-- Prevent anonymous clients from reading agent passwords or training content.
-- Public pages read the deliberately limited view below; server-side chat uses
-- the service-role client for the full configuration and knowledge base.

DROP POLICY IF EXISTS "Public agent configs are viewable by everyone"
ON public.agent_configs;

DROP POLICY IF EXISTS "Owners can manage their own agent config"
ON public.agent_configs;

CREATE POLICY "Owners can manage their own agent config"
ON public.agent_configs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP VIEW IF EXISTS public.agent_configs_public;

CREATE VIEW public.agent_configs_public
WITH (security_barrier = true)
AS
SELECT
  id,
  user_id,
  agent_name,
  bio,
  agent_avatar,
  welcome_message,
  is_enabled,
  primary_color,
  position,
  access_level,
  chat_bg_color,
  user_bubble_color,
  ai_bubble_color,
  cta_button_color,
  cta_text_color,
  pre_chat_text_color,
  gatekeeper_text_color,
  font_family,
  profession,
  social_links
FROM public.agent_configs;

REVOKE ALL ON public.agent_configs_public FROM PUBLIC;
GRANT SELECT ON public.agent_configs_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active knowledge"
ON public.agent_knowledge;
