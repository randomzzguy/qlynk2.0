BEGIN;
CREATE TABLE public.ai_provider_budgets (
  scope TEXT NOT NULL,
  model TEXT NOT NULL,
  blocked_until TIMESTAMPTZ NOT NULL DEFAULT 'epoch',
  PRIMARY KEY(scope, model)
);
CREATE TABLE public.ai_provider_requests (
  id UUID PRIMARY KEY,
  scope TEXT NOT NULL,
  model TEXT NOT NULL,
  estimated_tokens INTEGER NOT NULL CHECK (estimated_tokens > 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  active_until TIMESTAMPTZ NOT NULL,
  FOREIGN KEY(scope, model) REFERENCES public.ai_provider_budgets ON DELETE CASCADE
);
CREATE INDEX ai_provider_requests_window ON public.ai_provider_requests(scope, model, started_at);
ALTER TABLE public.ai_provider_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_provider_budgets, public.ai_provider_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_provider_budgets, public.ai_provider_requests TO service_role;

CREATE FUNCTION public.reserve_ai_provider_budget(
  p_scope TEXT, p_model TEXT, p_request_id UUID, p_tokens INTEGER,
  p_rpm INTEGER, p_rpd INTEGER, p_tpm INTEGER, p_tpd INTEGER,
  p_concurrency INTEGER, p_background BOOLEAN DEFAULT FALSE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  budget public.ai_provider_budgets%ROWTYPE;
  current_time_value TIMESTAMPTZ;
  counts RECORD;
  fraction NUMERIC := CASE WHEN p_background THEN 0.8 ELSE 1 END;
  wait_seconds INTEGER := 0;
BEGIN
  IF p_scope IS NULL OR length(p_scope) NOT BETWEEN 1 AND 100
    OR p_model IS NULL OR length(p_model) NOT BETWEEN 1 AND 200
    OR p_request_id IS NULL OR p_tokens IS NULL OR p_tokens <= 0
    OR p_rpm IS NULL OR p_rpm <= 0 OR p_rpd IS NULL OR p_rpd <= 0
    OR p_tpm IS NULL OR p_tpm <= 0 OR p_tpd IS NULL OR p_tpd <= 0
    OR p_concurrency IS NULL OR p_concurrency NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid AI budget parameters';
  END IF;
  INSERT INTO public.ai_provider_budgets(scope, model) VALUES(p_scope, p_model) ON CONFLICT DO NOTHING;
  SELECT * INTO budget FROM public.ai_provider_budgets WHERE scope=p_scope AND model=p_model FOR UPDATE;
  current_time_value := clock_timestamp();
  -- Lock the bucket before checking any counter: independent app instances
  -- cannot spend the same remaining capacity. Rolling windows avoid boundary bursts.
  DELETE FROM public.ai_provider_requests WHERE scope=p_scope AND model=p_model
    AND started_at <= current_time_value - interval '24 hours';
  IF EXISTS(SELECT 1 FROM public.ai_provider_requests WHERE id=p_request_id) THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'duplicate', 'retry_after', 1);
  END IF;
  IF p_tokens > p_tpm OR p_tokens > p_tpd THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'too_large', 'retry_after', 0);
  END IF;
  IF budget.blocked_until > current_time_value THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'cooldown', 'retry_after',
      GREATEST(1, ceil(extract(epoch FROM budget.blocked_until-current_time_value))::integer));
  END IF;
  SELECT count(*) AS day_requests, COALESCE(sum(estimated_tokens),0) AS day_tokens,
    count(*) FILTER (WHERE started_at > current_time_value - interval '1 minute') AS minute_requests,
    COALESCE(sum(estimated_tokens) FILTER (WHERE started_at > current_time_value - interval '1 minute'),0) AS minute_tokens,
    count(*) FILTER (WHERE active_until > current_time_value) AS active_requests,
    min(active_until) FILTER (WHERE active_until > current_time_value) AS next_active_end,
    min(started_at) AS oldest_request
  INTO counts FROM public.ai_provider_requests WHERE scope=p_scope AND model=p_model;

  IF counts.minute_requests + 1 > floor(p_rpm*fraction)
    OR counts.minute_tokens + p_tokens > floor(p_tpm*fraction) THEN wait_seconds := 60; END IF;
  IF counts.day_requests + 1 > floor(p_rpd*fraction)
    OR counts.day_tokens + p_tokens > floor(p_tpd*fraction) THEN
    wait_seconds := GREATEST(wait_seconds, COALESCE(ceil(extract(epoch FROM counts.oldest_request + interval '24 hours' - current_time_value))::integer, 86400));
  END IF;
  -- Background tasks run only when no other call is active for this model.
  IF counts.active_requests >= (CASE WHEN p_background THEN 1 ELSE p_concurrency END) THEN
    wait_seconds := GREATEST(wait_seconds, ceil(extract(epoch FROM counts.next_active_end-current_time_value))::integer);
  END IF;
  IF wait_seconds > 0 THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'capacity', 'retry_after', wait_seconds);
  END IF;
  INSERT INTO public.ai_provider_requests(id, scope, model, estimated_tokens, started_at, active_until)
  VALUES(p_request_id, p_scope, p_model, p_tokens, current_time_value, current_time_value + interval '45 seconds');
  RETURN jsonb_build_object('allowed', TRUE);
END;
$$;

CREATE FUNCTION public.finish_ai_provider_request(p_request_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  UPDATE public.ai_provider_requests SET active_until='epoch' WHERE id=p_request_id;
$$;

CREATE FUNCTION public.cooldown_ai_provider_budget(p_scope TEXT, p_model TEXT, p_seconds INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_seconds IS NULL OR p_seconds < 1 OR p_seconds > 604800 THEN RAISE EXCEPTION 'Invalid provider cooldown'; END IF;
  INSERT INTO public.ai_provider_budgets(scope, model, blocked_until)
  VALUES(p_scope, p_model, clock_timestamp() + make_interval(secs => p_seconds))
  ON CONFLICT(scope, model) DO UPDATE
  SET blocked_until=GREATEST(ai_provider_budgets.blocked_until, EXCLUDED.blocked_until);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_ai_provider_budget(TEXT,TEXT,UUID,INTEGER,INTEGER,INTEGER,INTEGER,INTEGER,INTEGER,BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_ai_provider_request(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cooldown_ai_provider_budget(TEXT,TEXT,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_provider_budget(TEXT,TEXT,UUID,INTEGER,INTEGER,INTEGER,INTEGER,INTEGER,INTEGER,BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_ai_provider_request(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cooldown_ai_provider_budget(TEXT,TEXT,INTEGER) TO service_role;
COMMIT;
