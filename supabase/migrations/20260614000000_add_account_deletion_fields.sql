ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_deletion_scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_account_deletion_scheduled_for
  ON public.profiles (account_deletion_scheduled_for);

COMMENT ON COLUMN public.profiles.account_deletion_requested_at IS 'When the user requested deletion';
COMMENT ON COLUMN public.profiles.account_deletion_scheduled_for IS 'When the account should be permanently deleted';
