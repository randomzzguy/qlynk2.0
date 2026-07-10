-- Subscription billing and usage state is server-managed. Authenticated users
-- can read only their row and can update only their post-trial preference.

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.subscriptions',
      policy_record.policyname
    );
  END LOOP;
END $$;

CREATE POLICY "Users can read their own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial choice"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE public.subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.subscriptions TO authenticated;
GRANT UPDATE (post_trial_choice) ON TABLE public.subscriptions TO authenticated;

-- This legacy SECURITY DEFINER RPC accepted an arbitrary owner UUID. Usage is
-- now counted only by the agent_messages trigger and must not be client-callable.
REVOKE ALL ON FUNCTION public.increment_messages_used(UUID) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_post_trial_choice_check'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_post_trial_choice_check
      CHECK (post_trial_choice IN ('pause', 'creator', 'agency'));
  END IF;
END $$;
