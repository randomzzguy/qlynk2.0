-- Add post_trial_choice column to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS post_trial_choice TEXT DEFAULT 'pause',
ADD COLUMN IF NOT EXISTS pause_ends_at TIMESTAMPTZ;

-- Add a comment to explain the column
COMMENT ON COLUMN public.subscriptions.post_trial_choice IS 'The plan choice to execute after the 14-day trial ends: pause, creator, or agency';
