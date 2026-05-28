-- Add email_notified flag to agent_conversations
-- Prevents duplicate new-message emails for the same conversation
ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS email_notified BOOLEAN DEFAULT FALSE;

-- Add trial_warning_sent flag to subscriptions
-- Prevents the 3-day warning email from being re-sent on subsequent cron runs
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN DEFAULT FALSE;

-- Add notification preferences to profiles
-- Each column controls whether the user wants that type of email
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_new_message BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_trial_expiry BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_subscription  BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN agent_conversations.email_notified IS 'True once the owner has been emailed about this conversation';
COMMENT ON COLUMN profiles.notif_new_message       IS 'Email owner when a new chat conversation starts';
COMMENT ON COLUMN profiles.notif_trial_expiry      IS 'Email owner before and when their trial expires';
COMMENT ON COLUMN profiles.notif_subscription      IS 'Email owner on subscription renewals and billing events';
