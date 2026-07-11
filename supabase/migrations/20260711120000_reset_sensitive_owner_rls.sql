-- Reset every deployed policy on sensitive user-owned tables. This is
-- intentionally catalog-driven so it removes policy drift and unknown legacy
-- policy names, not only policies known to the migration history.

DO $$
DECLARE
  target_table TEXT;
  policy_record RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agent_configs',
    'agent_knowledge',
    'agent_documents',
    'agent_conversations',
    'agent_messages',
    'page_views',
    'subscriptions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, target_table);
    END LOOP;
  END LOOP;
END
$$;

CREATE POLICY "Owners manage their own agent config"
ON public.agent_configs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners manage their own agent knowledge"
ON public.agent_knowledge FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners manage their own agent documents"
ON public.agent_documents FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners read their own conversations"
ON public.agent_conversations FOR SELECT TO authenticated
USING (auth.uid() = agent_owner_id);

CREATE POLICY "Owners read messages from their conversations"
ON public.agent_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_conversations
    WHERE agent_conversations.id = agent_messages.conversation_id
      AND agent_conversations.agent_owner_id = auth.uid()
  )
);

CREATE POLICY "Owners read their own page views"
ON public.page_views FOR SELECT TO authenticated
USING (auth.uid() = page_owner_id);

CREATE POLICY "Owners read their own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners update their own trial choice"
ON public.subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE
  public.agent_configs,
  public.agent_knowledge,
  public.agent_documents,
  public.agent_conversations,
  public.agent_messages,
  public.page_views,
  public.subscriptions
FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.agent_configs,
  public.agent_knowledge,
  public.agent_documents
TO authenticated;

GRANT SELECT ON TABLE
  public.agent_conversations,
  public.agent_messages,
  public.page_views,
  public.subscriptions
TO authenticated;

REVOKE UPDATE ON TABLE public.subscriptions FROM authenticated;
GRANT UPDATE (post_trial_choice) ON TABLE public.subscriptions TO authenticated;
