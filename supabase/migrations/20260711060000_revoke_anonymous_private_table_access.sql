-- Defense in depth: public pages must use the restricted views, never the
-- private base tables. Revoking table privileges prevents an unexpected or
-- legacy permissive RLS policy from exposing secret/account columns.

REVOKE ALL ON TABLE public.agent_configs FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.agent_configs
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles
TO authenticated;

REVOKE ALL ON TABLE public.agent_configs_public FROM PUBLIC;
GRANT SELECT ON TABLE public.agent_configs_public TO anon, authenticated;

REVOKE ALL ON TABLE public.profiles_public FROM PUBLIC;
GRANT SELECT ON TABLE public.profiles_public TO anon, authenticated;
