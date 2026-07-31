-- Durable website-widget installations with owner-only management and
-- server-recorded attribution for conversations and traffic.

CREATE TABLE IF NOT EXISTS public.widget_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_config_id UUID NOT NULL REFERENCES public.agent_configs(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Primary website widget',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  allowed_origins TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  position TEXT NOT NULL DEFAULT 'bottom-right'
    CHECK (position IN ('bottom-right', 'bottom-left')),
  launcher_color TEXT
    CHECK (launcher_color IS NULL OR launcher_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT widget_installations_owner_unique UNIQUE (owner_id),
  CONSTRAINT widget_installations_agent_unique UNIQUE (agent_config_id),
  CONSTRAINT widget_installations_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT widget_installations_origin_limit CHECK (cardinality(allowed_origins) <= 10)
);

CREATE INDEX IF NOT EXISTS widget_installations_owner_idx
  ON public.widget_installations (owner_id);

ALTER TABLE public.widget_installations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.widget_installations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.widget_installations TO service_role;

ALTER TABLE public.agent_conversations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'hosted'
    CHECK (channel IN ('hosted', 'widget')),
  ADD COLUMN IF NOT EXISTS widget_installation_id UUID
    REFERENCES public.widget_installations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_origin TEXT;

CREATE INDEX IF NOT EXISTS agent_conversations_widget_idx
  ON public.agent_conversations (widget_installation_id, created_at DESC);

ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'hosted'
    CHECK (channel IN ('hosted', 'widget')),
  ADD COLUMN IF NOT EXISTS widget_installation_id UUID
    REFERENCES public.widget_installations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_origin TEXT;

CREATE INDEX IF NOT EXISTS page_views_widget_idx
  ON public.page_views (widget_installation_id, created_at DESC);

COMMENT ON TABLE public.widget_installations IS
'Private website-widget configuration. Public rendering is resolved through server routes only.';
COMMENT ON COLUMN public.widget_installations.allowed_origins IS
'Exact normalized http(s) origins allowed to initialize this widget. Empty means any origin.';
