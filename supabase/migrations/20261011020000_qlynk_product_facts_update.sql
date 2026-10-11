BEGIN;

CREATE TABLE public.qlynk_product_update_backups (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_key TEXT NOT NULL,
  before_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_source_ids UUID[] NOT NULL DEFAULT '{}',
  before_rules JSONB,
  before_agent_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qlynk_product_update_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qlynk_product_update_backups FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.qlynk_product_update_backups TO service_role;
GRANT SELECT ON public.qlynk_product_update_backups TO authenticated;
CREATE POLICY "Owner can read product update backup" ON public.qlynk_product_update_backups
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_qlynk_product_facts(
  p_owner_id UUID, p_pack_key TEXT, p_archive_ids UUID[], p_facts JSONB,
  p_rules JSONB DEFAULT NULL, p_expected_version INTEGER DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  fact JSONB;
  source_id UUID;
  inserted_ids UUID[] := '{}';
  previous_sources JSONB;
  fact_count INTEGER := 0;
  previous_rules JSONB;
  previous_agent_type TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_owner_id AND username = 'qlynk') THEN
    RAISE EXCEPTION 'Only the Qlynk product account can apply this pack';
  END IF;
  IF p_pack_key <> 'free-creator-2026-10-11' OR jsonb_typeof(p_facts) <> 'array'
    OR jsonb_array_length(p_facts) <> 8 THEN RAISE EXCEPTION 'Invalid product fact pack'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));
  -- Keep the original backup across repeated applications until the owner undoes it.
  IF EXISTS (SELECT 1 FROM public.qlynk_product_update_backups WHERE user_id = p_owner_id) THEN
    RAISE EXCEPTION 'Product update already applied; undo it before replacing this pack';
  END IF;
  -- Match the dashboard's rule-save lock order and refuse a stale review.
  PERFORM 1 FROM auth.users WHERE id = p_owner_id FOR UPDATE;
  IF p_rules IS NOT NULL THEN
    SELECT to_jsonb(r) INTO previous_rules FROM public.agent_rule_configs r WHERE user_id = p_owner_id;
    SELECT agent_type INTO previous_agent_type FROM public.agent_configs WHERE user_id = p_owner_id;
    IF previous_rules IS NULL OR p_expected_version IS NULL
      OR (previous_rules->>'prompt_version')::INTEGER <> p_expected_version THEN
      RAISE EXCEPTION 'Product instructions changed; review the update again';
    END IF;
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(k)), '[]'::jsonb) INTO previous_sources
  FROM public.agent_knowledge k WHERE user_id = p_owner_id
    AND (id = ANY(COALESCE(p_archive_ids, '{}')) OR title IN (SELECT value->>'title' FROM jsonb_array_elements(p_facts)));
  UPDATE public.agent_knowledge SET is_active = FALSE
  WHERE user_id = p_owner_id AND id = ANY(COALESCE(p_archive_ids, '{}'));
  FOR fact IN SELECT value FROM jsonb_array_elements(p_facts) LOOP
    IF left(fact->>'title', 22) <> '[Qlynk product facts] ' OR length(fact->>'content') > 10000
      OR COALESCE(fact->>'content', '') = '' THEN RAISE EXCEPTION 'Invalid product fact'; END IF;
    SELECT id INTO source_id FROM public.agent_knowledge
    WHERE user_id = p_owner_id AND title = fact->>'title' ORDER BY created_at LIMIT 1;
    IF source_id IS NULL THEN
      INSERT INTO public.agent_knowledge (user_id, title, content, source_type, category, priority, is_active, evidence_status, verified_at)
      VALUES (p_owner_id, fact->>'title', fact->>'content', fact->>'source_type', fact->>'category', 5, TRUE, 'verified', now())
      RETURNING id INTO source_id;
      inserted_ids := array_append(inserted_ids, source_id);
    ELSE
      UPDATE public.agent_knowledge SET content = fact->>'content', source_type = fact->>'source_type',
        category = fact->>'category', priority = 5, is_active = TRUE, evidence_status = 'verified',
        valid_from = NULL, valid_until = NULL, verified_at = now()
      WHERE id = source_id AND user_id = p_owner_id;
    END IF;
    fact_count := fact_count + 1;
  END LOOP;
  IF p_rules IS NOT NULL THEN
    PERFORM public.save_agent_rule_config(p_owner_id, previous_agent_type, p_rules);
  END IF;
  INSERT INTO public.qlynk_product_update_backups (user_id, pack_key, before_sources, new_source_ids, before_rules, before_agent_type)
  VALUES (p_owner_id, p_pack_key, previous_sources, inserted_ids, previous_rules, previous_agent_type);
  RETURN fact_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.undo_qlynk_product_facts(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  backup public.qlynk_product_update_backups%ROWTYPE;
  original JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_owner_id AND username = 'qlynk') THEN
    RAISE EXCEPTION 'Only the Qlynk product account can undo this pack';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_owner_id::text, 0));
  SELECT * INTO backup FROM public.qlynk_product_update_backups WHERE user_id = p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  UPDATE public.agent_knowledge SET is_active = FALSE WHERE user_id = p_owner_id AND id = ANY(backup.new_source_ids);
  FOR original IN SELECT value FROM jsonb_array_elements(backup.before_sources) LOOP
    UPDATE public.agent_knowledge SET title = original->>'title', content = original->>'content',
      source_type = original->>'source_type', category = original->>'category',
      priority = (original->>'priority')::INTEGER, is_active = (original->>'is_active')::BOOLEAN,
      evidence_status = original->>'evidence_status', verified_at = (original->>'verified_at')::TIMESTAMPTZ,
      valid_from = (original->>'valid_from')::TIMESTAMPTZ, valid_until = (original->>'valid_until')::TIMESTAMPTZ
    WHERE id = (original->>'id')::UUID AND user_id = p_owner_id;
  END LOOP;
  IF backup.before_rules IS NOT NULL THEN
    PERFORM public.save_agent_rule_config(p_owner_id, backup.before_agent_type, backup.before_rules);
  END IF;
  DELETE FROM public.qlynk_product_update_backups WHERE user_id = p_owner_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_qlynk_product_facts(UUID, TEXT, UUID[], JSONB, JSONB, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.undo_qlynk_product_facts(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_qlynk_product_facts(UUID, TEXT, UUID[], JSONB, JSONB, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.undo_qlynk_product_facts(UUID) TO service_role;

COMMIT;
