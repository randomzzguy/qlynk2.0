-- Optional widget-specific lead capture shown before the visitor can chat.
-- Existing widgets remain unchanged until their owner enables the form.

ALTER TABLE public.widget_installations
  ADD COLUMN IF NOT EXISTS pre_chat_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_chat_email_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pre_chat_email_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_chat_intro TEXT NOT NULL
    DEFAULT 'Tell us who you are so we can better assist you.';

ALTER TABLE public.widget_installations
  DROP CONSTRAINT IF EXISTS widget_installations_pre_chat_intro_length;

ALTER TABLE public.widget_installations
  ADD CONSTRAINT widget_installations_pre_chat_intro_length
  CHECK (char_length(pre_chat_intro) BETWEEN 1 AND 240);

COMMENT ON COLUMN public.widget_installations.pre_chat_enabled IS
'When enabled, visitors provide a required name before the widget chat begins.';
COMMENT ON COLUMN public.widget_installations.pre_chat_email_enabled IS
'Shows an email field on the widget pre-chat form. Email remains optional unless separately required.';
