-- Create the base table for fresh environments, then ensure Stripe columns.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT DEFAULT 'trial',
  status TEXT DEFAULT 'trialing',
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  trial_already_used BOOLEAN DEFAULT false,
  post_trial_choice TEXT DEFAULT 'pause',
  pause_ends_at TIMESTAMPTZ,
  trial_warning_sent BOOLEAN DEFAULT false,
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER,
  agents_count INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  billing_cycle_start TIMESTAMPTZ,
  billing_cycle_end TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Index for faster lookups during webhooks
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
