-- Migration: Add Chat Visual Customization fields to agent_configs
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS chat_bg_color       TEXT DEFAULT '#0a0a0f',
  ADD COLUMN IF NOT EXISTS user_bubble_color   TEXT DEFAULT '#ffffff1a',
  ADD COLUMN IF NOT EXISTS ai_bubble_color     TEXT DEFAULT '#3b82f620',
  ADD COLUMN IF NOT EXISTS cta_button_color    TEXT DEFAULT '#f46530',
  ADD COLUMN IF NOT EXISTS cta_text_color      TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS pre_chat_text_color TEXT DEFAULT '#9ca3af',
  ADD COLUMN IF NOT EXISTS gatekeeper_text_color TEXT DEFAULT '#9ca3af',
  ADD COLUMN IF NOT EXISTS font_family         TEXT DEFAULT 'Inter';
