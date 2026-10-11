BEGIN;

ALTER TABLE public.subscriptions
  ALTER COLUMN tier SET DEFAULT 'creator',
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN post_trial_choice SET DEFAULT 'creator',
  ALTER COLUMN trial_started_at DROP DEFAULT;

-- Do not detach a historical Stripe subscription without reconciling billing.
UPDATE public.subscriptions
SET tier = 'creator', status = 'active', trial_ends_at = NULL,
    post_trial_choice = 'creator', trial_warning_sent = TRUE, updated_at = now()
WHERE stripe_subscription_id IS NULL
  AND lower(tier) IN ('trial', 'free', 'creator', 'pro', 'agency', 'business')
  AND lower(status) <> 'paused'
  AND (lower(tier) IN ('trial', 'free', 'creator', 'pro')
       OR lower(status) IN ('canceled', 'incomplete_expired'));

INSERT INTO public.subscriptions (user_id, tier, status, post_trial_choice)
SELECT id, 'creator', 'active', 'creator' FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Lock each reservation so month rollover resets once under concurrent traffic.
-- The caller can reduce, never raise, the database-derived plan allowance.
CREATE OR REPLACE FUNCTION public.consume_agent_message_credit(
  p_owner_id UUID, p_message_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, messages_used INTEGER, remaining INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  subscription_row public.subscriptions%ROWTYPE;
  month_start TIMESTAMPTZ := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  current_count INTEGER;
  effective_limit INTEGER;
BEGIN
  IF p_owner_id IS NULL OR p_message_limit IS NULL OR p_message_limit <= 0 THEN
    RAISE EXCEPTION 'Invalid message credit parameters';
  END IF;
  SELECT * INTO subscription_row FROM public.subscriptions
  WHERE user_id = p_owner_id FOR UPDATE;
  IF NOT FOUND OR COALESCE(lower(subscription_row.status), '') NOT IN ('active', 'trialing', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired')
    OR COALESCE(lower(subscription_row.tier), '') NOT IN ('trial', 'free', 'creator', 'pro', 'agency', 'business') THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;
  effective_limit := LEAST(p_message_limit, CASE
    WHEN lower(subscription_row.tier) IN ('agency', 'business')
      AND lower(subscription_row.status) IN ('active', 'trialing') THEN 10000
    ELSE 5000 END);
  current_count := CASE WHEN COALESCE(subscription_row.last_reset_at, subscription_row.created_at) < month_start
    THEN 0 ELSE COALESCE(subscription_row.messages_used, 0) END;
  IF current_count >= effective_limit THEN
    RETURN QUERY SELECT FALSE, current_count, 0;
    RETURN;
  END IF;
  UPDATE public.subscriptions
  SET messages_used = current_count + 1,
      last_reset_at = CASE WHEN COALESCE(last_reset_at, created_at) < month_start THEN now() ELSE last_reset_at END
  WHERE user_id = p_owner_id;
  RETURN QUERY SELECT TRUE, current_count + 1, GREATEST(effective_limit - current_count - 1, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_agent_message_credit(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_agent_message_credit(UUID, INTEGER) TO service_role;

COMMIT;
