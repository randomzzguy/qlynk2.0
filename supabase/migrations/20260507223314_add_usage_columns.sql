-- Add usage tracking columns to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS messages_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ DEFAULT now();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- RPC function to atomically increment messages
CREATE OR REPLACE FUNCTION public.increment_messages_used(owner_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET messages_used = COALESCE(messages_used, 0) + 1
  WHERE user_id = owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
