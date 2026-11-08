BEGIN;

-- Some deployments still have the July credit RPC, which increments usage
-- without updating last_reset_at. The dashboard consequently displays zero.
-- Repair only stale periods from stored visitor prompts; current reservations
-- (including requests that failed after reserving a credit) must be preserved.
LOCK TABLE public.subscriptions IN SHARE ROW EXCLUSIVE MODE;

UPDATE public.subscriptions AS subscription
SET messages_used = (
      SELECT count(*)::integer
      FROM public.agent_messages AS message
      JOIN public.agent_conversations AS conversation
        ON conversation.id = message.conversation_id
      WHERE conversation.agent_owner_id = subscription.user_id
        AND message.role = 'user'
        AND message.created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    ),
    last_reset_at = now()
WHERE COALESCE(subscription.last_reset_at, subscription.created_at, 'epoch'::timestamptz)
  < date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

-- Install the monthly reservation independently of the broader free-plan
-- rollout. This migration does not change subscriptions' billing or plan state.
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
  current_count := CASE WHEN COALESCE(subscription_row.last_reset_at, subscription_row.created_at, 'epoch'::timestamptz) < month_start
    THEN 0 ELSE COALESCE(subscription_row.messages_used, 0) END;
  IF current_count >= effective_limit THEN
    RETURN QUERY SELECT FALSE, current_count, 0;
    RETURN;
  END IF;
  UPDATE public.subscriptions
  SET messages_used = current_count + 1,
      last_reset_at = CASE WHEN COALESCE(last_reset_at, created_at, 'epoch'::timestamptz) < month_start THEN now() ELSE last_reset_at END
  WHERE user_id = p_owner_id;
  RETURN QUERY SELECT TRUE, current_count + 1, GREATEST(effective_limit - current_count - 1, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_agent_message_credit(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_agent_message_credit(UUID, INTEGER) TO service_role;

COMMIT;
