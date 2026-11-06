-- Independent, widget-only colors for the visitor-details form.
-- Existing widgets retain their background/button fallbacks and get readable
-- form text defaults without changing hosted agent page styling.
ALTER TABLE public.widget_installations
  ADD COLUMN IF NOT EXISTS pre_chat_style JSONB NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT widget_installations_pre_chat_style_object
    CHECK (jsonb_typeof(pre_chat_style) = 'object');

COMMENT ON COLUMN public.widget_installations.pre_chat_style IS
'Owner-selected pre-chat form colors. Validated by the widget API and resolved identically in previews and live embeds.';

NOTIFY pgrst, 'reload schema';
