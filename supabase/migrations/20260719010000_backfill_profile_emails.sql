-- Keep private profile email data aligned with the authoritative Supabase Auth user.
-- Signup now writes this field for new accounts; this repairs existing rows.
UPDATE public.profiles AS profile
SET email = lower(trim(auth_user.email))
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND auth_user.email IS NOT NULL
  AND profile.email IS DISTINCT FROM lower(trim(auth_user.email));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_ci_idx
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN public.profiles.email IS
  'Private normalized account email mirrored from Supabase Auth for server-side account management.';
