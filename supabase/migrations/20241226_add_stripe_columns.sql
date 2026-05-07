-- Ensure subscriptions table has Stripe columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Index for faster lookups during webhooks
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
