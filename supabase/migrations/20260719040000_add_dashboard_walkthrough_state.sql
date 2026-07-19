-- Track the dashboard walkthrough across browsers without automatically
-- interrupting customers who were already using Qlynk before it launched.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dashboard_tour_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dashboard_tour_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dashboard_tour_completed_at TIMESTAMPTZ;

-- Existing completed accounts can replay the guide from Settings, but should
-- not have a new first-run experience forced on them. Accounts that have not
-- finished onboarding remain eligible once onboarding sends them to dashboard.
UPDATE public.profiles
SET
  dashboard_tour_status = CASE
    WHEN onboarding_completed IS TRUE THEN 'skipped'
    ELSE 'pending'
  END,
  dashboard_tour_version = 1,
  dashboard_tour_completed_at = CASE
    WHEN onboarding_completed IS TRUE THEN now()
    ELSE NULL
  END
WHERE dashboard_tour_status IS NULL
   OR dashboard_tour_status = 'pending';

ALTER TABLE public.profiles
  ALTER COLUMN dashboard_tour_status SET DEFAULT 'pending',
  ALTER COLUMN dashboard_tour_status SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_dashboard_tour_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dashboard_tour_status_check
  CHECK (dashboard_tour_status IN ('pending', 'completed', 'skipped'));

COMMENT ON COLUMN public.profiles.dashboard_tour_status IS
  'First-run dashboard walkthrough state: pending, completed, or skipped.';
COMMENT ON COLUMN public.profiles.dashboard_tour_version IS
  'Version of the dashboard walkthrough last offered to this account.';
COMMENT ON COLUMN public.profiles.dashboard_tour_completed_at IS
  'When the current walkthrough was completed or skipped.';
