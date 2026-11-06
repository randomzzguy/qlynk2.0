-- Owner-controlled agent names and welcome headings. Keep the white fallback
-- for existing agents and expose only this non-sensitive visual setting.
BEGIN;

ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS heading_text_color TEXT DEFAULT '#ffffff';
ALTER TABLE public.agent_configs_public_data
  ADD COLUMN IF NOT EXISTS heading_text_color TEXT DEFAULT '#ffffff';

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
    agent_type,
    heading_text_color
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
    NEW.agent_type,
    NEW.heading_text_color
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
    agent_type = EXCLUDED.agent_type,
    heading_text_color = EXCLUDED.heading_text_color;
  RETURN NEW;
END;
$$;

-- Populate existing projections without replaying updates on private configs.
UPDATE public.agent_configs_public_data AS projection
SET heading_text_color = agent.heading_text_color
FROM public.agent_configs AS agent
WHERE projection.id = agent.id;

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
  agent_type,
  heading_text_color
FROM public.agent_configs_public_data;

NOTIFY pgrst, 'reload schema';
COMMIT;
