-- Production drift audit found an authenticated cross-account profile read even
-- though the known legacy public policy had been dropped. Remove every deployed
-- policy on the private base table by catalog name, then recreate the single
-- intended owner policy. Public identity reads must use profiles_public.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Owners can manage their own private profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
