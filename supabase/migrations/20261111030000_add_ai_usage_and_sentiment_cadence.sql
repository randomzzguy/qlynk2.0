BEGIN;
ALTER TABLE public.ai_provider_requests
  ADD COLUMN workload TEXT,
  ADD COLUMN prompt_tokens INTEGER,
  ADD COLUMN completion_tokens INTEGER,
  ADD COLUMN cached_tokens INTEGER,
  ADD COLUMN usage_recorded_at TIMESTAMPTZ;

CREATE FUNCTION public.complete_ai_provider_request(p_request_id UUID, p_workload TEXT, p_usage JSONB DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  prompt_count INTEGER;
  completion_count INTEGER;
  cache_count INTEGER;
BEGIN
  IF p_workload NOT IN ('chat', 'scope', 'sentiment', 'demo', 'knowledge_graph', 'other') OR p_workload IS NULL THEN
    RAISE EXCEPTION 'Invalid AI workload';
  END IF;
  IF p_usage IS NOT NULL THEN
    IF jsonb_typeof(p_usage->'prompt_tokens') IS DISTINCT FROM 'number'
      OR jsonb_typeof(p_usage->'completion_tokens') IS DISTINCT FROM 'number'
      OR jsonb_typeof(p_usage->'cached_tokens') IS DISTINCT FROM 'number'
      OR (p_usage->>'prompt_tokens') !~ '^[0-9]{1,9}$'
      OR (p_usage->>'completion_tokens') !~ '^[0-9]{1,9}$'
      OR (p_usage->>'cached_tokens') !~ '^[0-9]{1,9}$' THEN RAISE EXCEPTION 'Invalid AI usage'; END IF;
    prompt_count := (p_usage->>'prompt_tokens')::integer;
    completion_count := (p_usage->>'completion_tokens')::integer;
    cache_count := (p_usage->>'cached_tokens')::integer;
    IF cache_count > prompt_count THEN RAISE EXCEPTION 'Invalid cached usage'; END IF;
  END IF;
  -- Estimates still govern admission. Observations never manufacture capacity.
  UPDATE public.ai_provider_requests SET active_until='epoch', workload=p_workload,
    prompt_tokens=COALESCE(prompt_tokens, prompt_count),
    completion_tokens=COALESCE(completion_tokens, completion_count),
    cached_tokens=COALESCE(cached_tokens, cache_count),
    usage_recorded_at=COALESCE(usage_recorded_at, CASE WHEN p_usage IS NOT NULL THEN clock_timestamp() END)
  WHERE id=p_request_id;
END;
$$;

CREATE FUNCTION public.get_ai_usage_summary()
RETURNS TABLE(scope TEXT, model TEXT, workload TEXT, requests BIGINT, measured_requests BIGINT,
  estimated_tokens BIGINT, measured_estimated_tokens BIGINT, prompt_tokens BIGINT, completion_tokens BIGINT, cached_tokens BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT r.scope, r.model, COALESCE(r.workload,'unreported'), count(*), count(r.usage_recorded_at),
    sum(r.estimated_tokens), COALESCE(sum(r.estimated_tokens) FILTER (WHERE r.usage_recorded_at IS NOT NULL),0),
    COALESCE(sum(r.prompt_tokens),0), COALESCE(sum(r.completion_tokens),0), COALESCE(sum(r.cached_tokens),0)
  FROM public.ai_provider_requests r WHERE r.started_at > clock_timestamp() - interval '24 hours'
  GROUP BY r.scope, r.model, COALESCE(r.workload,'unreported');
$$;

-- Private state avoids granting visitors/owners the ability to trigger repeated
-- analysis through edits to otherwise readable conversation fields.
CREATE TABLE public.agent_sentiment_checks (
  conversation_id UUID PRIMARY KEY REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL,
  claimed_messages INTEGER NOT NULL DEFAULT 0,
  analyzed_messages INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch'
);
ALTER TABLE public.agent_sentiment_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agent_sentiment_checks FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.agent_sentiment_checks TO service_role;

CREATE FUNCTION public.claim_agent_sentiment_check(p_conversation_id UUID, p_claim_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  previous public.agent_sentiment_checks%ROWTYPE;
  message_total INTEGER;
BEGIN
  IF p_claim_id IS NULL THEN RAISE EXCEPTION 'Invalid sentiment claim'; END IF;
  PERFORM 1 FROM public.agent_conversations WHERE id=p_conversation_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  INSERT INTO public.agent_sentiment_checks(conversation_id, claim_id) VALUES(p_conversation_id,p_claim_id) ON CONFLICT DO NOTHING;
  SELECT * INTO previous FROM public.agent_sentiment_checks WHERE conversation_id=p_conversation_id FOR UPDATE;
  IF previous.last_attempt_at > clock_timestamp() - interval '5 minutes' THEN RETURN FALSE; END IF;
  SELECT count(*) INTO message_total FROM public.agent_messages WHERE conversation_id=p_conversation_id AND role='user';
  IF message_total < (CASE WHEN previous.analyzed_messages=0 THEN 3 ELSE previous.analyzed_messages+5 END) THEN RETURN FALSE; END IF;
  UPDATE public.agent_sentiment_checks SET claim_id=p_claim_id, claimed_messages=message_total, last_attempt_at=clock_timestamp()
  WHERE conversation_id=p_conversation_id;
  RETURN TRUE;
END;
$$;

CREATE FUNCTION public.finish_agent_sentiment_check(p_conversation_id UUID, p_claim_id UUID, p_sentiment TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE updated_count INTEGER;
BEGIN
  IF p_sentiment IS NULL OR p_sentiment NOT IN ('positive','neutral','negative') THEN RAISE EXCEPTION 'Invalid sentiment'; END IF;
  PERFORM 1 FROM public.agent_conversations WHERE id=p_conversation_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  UPDATE public.agent_sentiment_checks SET analyzed_messages=claimed_messages
  WHERE conversation_id=p_conversation_id AND claim_id=p_claim_id
    AND last_attempt_at > clock_timestamp()-interval '2 minutes' AND analyzed_messages<claimed_messages;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count=0 THEN RETURN FALSE; END IF;
  UPDATE public.agent_conversations SET sentiment=p_sentiment WHERE id=p_conversation_id;
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_ai_provider_request(UUID,TEXT,JSONB), public.get_ai_usage_summary(), public.claim_agent_sentiment_check(UUID,UUID), public.finish_agent_sentiment_check(UUID,UUID,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_provider_request(UUID,TEXT,JSONB), public.get_ai_usage_summary(), public.claim_agent_sentiment_check(UUID,UUID), public.finish_agent_sentiment_check(UUID,UUID,TEXT) TO service_role;
COMMIT;
