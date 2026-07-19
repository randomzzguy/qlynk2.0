-- Owner improvement workflows: knowledge gaps, visitor feedback, and staged
-- agent configuration publishing. Public writes remain server-mediated.

CREATE TABLE IF NOT EXISTS public.agent_knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  normalized_question TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open',
  source_conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_gaps_question_length CHECK (char_length(question) BETWEEN 1 AND 1000),
  CONSTRAINT agent_knowledge_gaps_normalized_length CHECK (char_length(normalized_question) BETWEEN 1 AND 1000),
  CONSTRAINT agent_knowledge_gaps_occurrence_positive CHECK (occurrence_count > 0),
  CONSTRAINT agent_knowledge_gaps_status_check CHECK (status IN ('open', 'resolved', 'dismissed')),
  CONSTRAINT agent_knowledge_gaps_owner_question_unique UNIQUE (user_id, normalized_question)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_gaps_owner_status_idx
ON public.agent_knowledge_gaps (user_id, status, last_seen_at DESC);

ALTER TABLE public.agent_knowledge_gaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage their own knowledge gaps" ON public.agent_knowledge_gaps;
CREATE POLICY "Owners manage their own knowledge gaps"
ON public.agent_knowledge_gaps FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE public.agent_knowledge_gaps FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_knowledge_gaps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_knowledge_gaps TO service_role;

CREATE OR REPLACE FUNCTION public.record_agent_knowledge_gap(
  p_owner_id UUID,
  p_question TEXT,
  p_normalized_question TEXT,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  gap_id UUID;
BEGIN
  IF p_owner_id IS NULL
     OR char_length(trim(coalesce(p_question, ''))) NOT BETWEEN 1 AND 1000
     OR char_length(trim(coalesce(p_normalized_question, ''))) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invalid knowledge gap';
  END IF;

  INSERT INTO public.agent_knowledge_gaps (
    user_id,
    question,
    normalized_question,
    source_conversation_id
  ) VALUES (
    p_owner_id,
    trim(p_question),
    trim(p_normalized_question),
    p_conversation_id
  )
  ON CONFLICT (user_id, normalized_question) DO UPDATE
  SET question = EXCLUDED.question,
      occurrence_count = public.agent_knowledge_gaps.occurrence_count + 1,
      source_conversation_id = coalesce(EXCLUDED.source_conversation_id, public.agent_knowledge_gaps.source_conversation_id),
      status = 'open',
      resolved_at = NULL,
      last_seen_at = now()
  RETURNING id INTO gap_id;

  RETURN gap_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_agent_knowledge_gap(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_agent_knowledge_gap(UUID, TEXT, TEXT, UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.agent_message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.agent_messages(id) ON DELETE CASCADE,
  visitor_key_hash TEXT NOT NULL,
  rating SMALLINT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_message_feedback_rating_check CHECK (rating IN (-1, 1)),
  CONSTRAINT agent_message_feedback_hash_length CHECK (char_length(visitor_key_hash) = 64),
  CONSTRAINT agent_message_feedback_reason_length CHECK (reason IS NULL OR char_length(reason) <= 500),
  CONSTRAINT agent_message_feedback_visitor_unique UNIQUE (message_id, visitor_key_hash)
);

CREATE INDEX IF NOT EXISTS agent_message_feedback_owner_created_idx
ON public.agent_message_feedback (agent_owner_id, created_at DESC);

ALTER TABLE public.agent_message_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read feedback for their agents" ON public.agent_message_feedback;
CREATE POLICY "Owners read feedback for their agents"
ON public.agent_message_feedback FOR SELECT TO authenticated
USING (auth.uid() = agent_owner_id);

REVOKE ALL ON TABLE public.agent_message_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.agent_message_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_message_feedback TO service_role;

CREATE TABLE IF NOT EXISTS public.agent_config_drafts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_config_drafts_config_object CHECK (jsonb_typeof(config) = 'object'),
  CONSTRAINT agent_config_drafts_rules_object CHECK (jsonb_typeof(rules) = 'object')
);

CREATE TABLE IF NOT EXISTS public.agent_publish_versions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  rules JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_publish_versions_unique UNIQUE (user_id, version),
  CONSTRAINT agent_publish_versions_config_object CHECK (jsonb_typeof(config) = 'object'),
  CONSTRAINT agent_publish_versions_rules_object CHECK (jsonb_typeof(rules) = 'object')
);

ALTER TABLE public.agent_config_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_publish_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.agent_config_drafts, public.agent_publish_versions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_config_drafts, public.agent_publish_versions TO service_role;

COMMENT ON TABLE public.agent_knowledge_gaps IS 'Owner-visible questions that need approved knowledge or clearer answers.';
COMMENT ON TABLE public.agent_message_feedback IS 'Privacy-minimized helpful or not-helpful ratings submitted through the server API.';
COMMENT ON TABLE public.agent_config_drafts IS 'Private staged configuration and rules that are not visible to public agents until published.';
COMMENT ON TABLE public.agent_publish_versions IS 'Private snapshots of successfully published agent configuration and rules.';
