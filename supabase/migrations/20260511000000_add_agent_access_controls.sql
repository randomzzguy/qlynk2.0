-- Migration to add Agent Access Controls
ALTER TABLE public.agent_configs
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS access_password TEXT;

ALTER TABLE public.agent_conversations
ADD COLUMN IF NOT EXISTS visitor_name TEXT,
ADD COLUMN IF NOT EXISTS visitor_email TEXT;
