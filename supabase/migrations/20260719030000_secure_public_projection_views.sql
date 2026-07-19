-- Replace privileged public views with security-invoker views backed by
-- deliberately limited projection tables. This preserves anonymous and
-- authenticated public-page reads without granting either role access to the
-- private profiles or agent_configs base tables.

CREATE TABLE IF NOT EXISTS public.profiles_public_data (
  id UUID PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.agent_configs_public_data (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  agent_name TEXT,
  bio TEXT,
  agent_avatar TEXT,
  welcome_message TEXT,
  is_enabled BOOLEAN,
  primary_color TEXT,
  position TEXT,
  access_level TEXT,
  chat_bg_color TEXT,
  user_bubble_color TEXT,
  ai_bubble_color TEXT,
  cta_button_color TEXT,
  cta_text_color TEXT,
  pre_chat_text_color TEXT,
  gatekeeper_text_color TEXT,
  font_family TEXT,
  profession TEXT,
  social_links JSONB,
  agent_type TEXT
);

ALTER TABLE public.profiles_public_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs_public_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public identity projections are readable" ON public.profiles_public_data;
CREATE POLICY "Public identity projections are readable"
ON public.profiles_public_data FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public agent projections are readable" ON public.agent_configs_public_data;
CREATE POLICY "Public agent projections are readable"
ON public.agent_configs_public_data FOR SELECT
TO anon, authenticated
USING (true);

REVOKE ALL ON TABLE public.profiles_public_data, public.agent_configs_public_data
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles_public_data, public.agent_configs_public_data
TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles_public_data, public.agent_configs_public_data
TO service_role;

CREATE OR REPLACE FUNCTION public.sync_profile_public_projection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.profiles_public_data WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.profiles_public_data (
    id, username, full_name, avatar_url, created_at
  ) VALUES (
    NEW.id, NEW.username, NEW.full_name, NEW.avatar_url, NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    created_at = EXCLUDED.created_at;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_agent_config_public_projection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.agent_configs_public_data WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.agent_configs_public_data (
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
    social_links,
    agent_type
  ) VALUES (
    NEW.id,
    NEW.user_id,
    NEW.agent_name,
    NEW.bio,
    NEW.agent_avatar,
    NEW.welcome_message,
    NEW.is_enabled,
    NEW.primary_color,
    NEW.position,
    NEW.access_level,
    NEW.chat_bg_color,
    NEW.user_bubble_color,
    NEW.ai_bubble_color,
    NEW.cta_button_color,
    NEW.cta_text_color,
    NEW.pre_chat_text_color,
    NEW.gatekeeper_text_color,
    NEW.font_family,
    NEW.profession,
    NEW.social_links,
    NEW.agent_type
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    agent_name = EXCLUDED.agent_name,
    bio = EXCLUDED.bio,
    agent_avatar = EXCLUDED.agent_avatar,
    welcome_message = EXCLUDED.welcome_message,
    is_enabled = EXCLUDED.is_enabled,
    primary_color = EXCLUDED.primary_color,
    position = EXCLUDED.position,
    access_level = EXCLUDED.access_level,
    chat_bg_color = EXCLUDED.chat_bg_color,
    user_bubble_color = EXCLUDED.user_bubble_color,
    ai_bubble_color = EXCLUDED.ai_bubble_color,
    cta_button_color = EXCLUDED.cta_button_color,
    cta_text_color = EXCLUDED.cta_text_color,
    pre_chat_text_color = EXCLUDED.pre_chat_text_color,
    gatekeeper_text_color = EXCLUDED.gatekeeper_text_color,
    font_family = EXCLUDED.font_family,
    profession = EXCLUDED.profession,
    social_links = EXCLUDED.social_links,
    agent_type = EXCLUDED.agent_type;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_public_projection() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_agent_config_public_projection() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_profile_public_projection_trigger ON public.profiles;
CREATE TRIGGER sync_profile_public_projection_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_public_projection();

DROP TRIGGER IF EXISTS sync_agent_config_public_projection_trigger ON public.agent_configs;
CREATE TRIGGER sync_agent_config_public_projection_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.agent_configs
FOR EACH ROW EXECUTE FUNCTION public.sync_agent_config_public_projection();

INSERT INTO public.profiles_public_data (id, username, full_name, avatar_url, created_at)
SELECT id, username, full_name, avatar_url, created_at
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  created_at = EXCLUDED.created_at;

INSERT INTO public.agent_configs_public_data (
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
  social_links,
  agent_type
)
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
  social_links,
  agent_type
FROM public.agent_configs
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  agent_name = EXCLUDED.agent_name,
  bio = EXCLUDED.bio,
  agent_avatar = EXCLUDED.agent_avatar,
  welcome_message = EXCLUDED.welcome_message,
  is_enabled = EXCLUDED.is_enabled,
  primary_color = EXCLUDED.primary_color,
  position = EXCLUDED.position,
  access_level = EXCLUDED.access_level,
  chat_bg_color = EXCLUDED.chat_bg_color,
  user_bubble_color = EXCLUDED.user_bubble_color,
  ai_bubble_color = EXCLUDED.ai_bubble_color,
  cta_button_color = EXCLUDED.cta_button_color,
  cta_text_color = EXCLUDED.cta_text_color,
  pre_chat_text_color = EXCLUDED.pre_chat_text_color,
  gatekeeper_text_color = EXCLUDED.gatekeeper_text_color,
  font_family = EXCLUDED.font_family,
  profession = EXCLUDED.profession,
  social_links = EXCLUDED.social_links,
  agent_type = EXCLUDED.agent_type;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id, username, full_name, avatar_url, created_at
FROM public.profiles_public_data;

CREATE OR REPLACE VIEW public.agent_configs_public
WITH (security_barrier = true, security_invoker = true)
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
  social_links,
  agent_type
FROM public.agent_configs_public_data;

REVOKE ALL ON TABLE public.profiles_public, public.agent_configs_public FROM PUBLIC;
GRANT SELECT ON TABLE public.profiles_public, public.agent_configs_public
TO anon, authenticated, service_role;

COMMENT ON TABLE public.profiles_public_data IS
'Synchronized safe identity projection used by the security-invoker profiles_public view.';
COMMENT ON TABLE public.agent_configs_public_data IS
'Synchronized safe agent projection used by the security-invoker agent_configs_public view.';
