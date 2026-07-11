-- Agent availability now has one canonical owner-controlled switch:
-- is_enabled. Keep the legacy column temporarily so this migration can be
-- deployed before the application without breaking the previously deployed
-- trial cron. New code no longer reads or writes it.
COMMENT ON COLUMN public.agent_configs.is_published IS
  'Deprecated compatibility column. Agent availability is derived from is_enabled and subscriptions; do not read or write this field.';
