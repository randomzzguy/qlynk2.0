-- Store agent gate credentials separately from browser-readable configuration.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.agent_access_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_access_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.agent_access_credentials FROM PUBLIC, anon, authenticated;

-- Preserve existing gates while converting their plaintext values to bcrypt.
INSERT INTO public.agent_access_credentials (user_id, password_hash)
SELECT
  user_id,
  extensions.crypt(access_password, extensions.gen_salt('bf', 12))
FROM public.agent_configs
WHERE access_password IS NOT NULL AND btrim(access_password) <> ''
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.agent_configs
SET access_password = NULL
WHERE access_password IS NOT NULL;

ALTER TABLE public.agent_configs
  DROP CONSTRAINT IF EXISTS agent_configs_access_password_must_be_null;

ALTER TABLE public.agent_configs
  ADD CONSTRAINT agent_configs_access_password_must_be_null
  CHECK (access_password IS NULL);
