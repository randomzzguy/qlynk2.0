BEGIN;

CREATE TABLE public.agent_chat_requests (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  visitor_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  question TEXT NOT NULL,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  credit_month TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  assistant_message_id UUID REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, request_id)
);
CREATE INDEX agent_chat_requests_pending ON public.agent_chat_requests(owner_id, expires_at) WHERE status = 'pending';
ALTER TABLE public.agent_chat_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agent_chat_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.agent_chat_requests TO service_role;

-- All operations lock the subscription first, so reservations, refunds and
-- month rollover serialize on the same row, including the legacy credit RPC.
CREATE FUNCTION public.reserve_agent_chat_request(
  p_owner_id UUID, p_request_id UUID, p_attempt_id UUID, p_visitor_id TEXT,
  p_fingerprint TEXT, p_question TEXT, p_message_limit INTEGER,
  p_conversation_id UUID DEFAULT NULL, p_context JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  req public.agent_chat_requests%ROWTYPE;
  conv public.agent_conversations%ROWTYPE;
  credit RECORD;
  expired_count INTEGER;
  month_start TIMESTAMPTZ := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  new_conversation BOOLEAN := FALSE;
  answer TEXT;
BEGIN
  IF p_owner_id IS NULL OR p_request_id IS NULL OR p_attempt_id IS NULL
    OR p_visitor_id IS NULL OR p_fingerprint IS NULL OR p_question IS NULL
    OR length(p_question) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Invalid chat request';
  END IF;
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'unavailable'); END IF;

  WITH expired AS (
    UPDATE public.agent_chat_requests SET status = 'failed'
    WHERE owner_id = p_owner_id AND status = 'pending' AND expires_at <= now()
    RETURNING credit_month
  ) SELECT count(*) INTO expired_count FROM expired WHERE credit_month = month_start;
  IF COALESCE(sub.last_reset_at, sub.created_at, 'epoch'::timestamptz) >= month_start THEN
    UPDATE public.subscriptions SET messages_used = GREATEST(0, messages_used - expired_count)
    WHERE user_id = p_owner_id;
  END IF;

  SELECT * INTO req FROM public.agent_chat_requests WHERE owner_id = p_owner_id AND request_id = p_request_id;
  IF FOUND THEN
    IF req.visitor_id <> p_visitor_id OR req.fingerprint <> p_fingerprint
      OR (p_conversation_id IS NOT NULL AND p_conversation_id <> req.conversation_id) THEN
      RETURN jsonb_build_object('status', 'conflict');
    END IF;
    IF req.status = 'completed' THEN
      SELECT content INTO answer FROM public.agent_messages WHERE id = req.assistant_message_id;
      RETURN jsonb_build_object('status', 'completed', 'conversation_id', req.conversation_id, 'answer', answer);
    END IF;
    IF req.status = 'pending' THEN
      RETURN jsonb_build_object('status', 'pending', 'conversation_id', req.conversation_id);
    END IF;
    p_conversation_id := req.conversation_id;
  END IF;

  IF p_conversation_id IS NOT NULL THEN
    SELECT * INTO conv FROM public.agent_conversations WHERE id = p_conversation_id;
    IF NOT FOUND OR conv.agent_owner_id <> p_owner_id OR conv.visitor_id <> p_visitor_id
      OR conv.channel <> COALESCE(p_context->>'channel', 'hosted')
      OR conv.widget_installation_id IS DISTINCT FROM (p_context->>'widget_installation_id')::uuid THEN
      RETURN jsonb_build_object('status', 'conflict');
    END IF;
  END IF;

  SELECT * INTO credit FROM public.consume_agent_message_credit(p_owner_id, p_message_limit);
  IF NOT credit.allowed THEN RETURN jsonb_build_object('status', 'limit'); END IF;
  IF p_conversation_id IS NULL THEN
    INSERT INTO public.agent_conversations(agent_owner_id, visitor_id, visitor_name, visitor_email, channel, widget_installation_id, source_origin)
    VALUES (p_owner_id, p_visitor_id, p_context->>'visitor_name', p_context->>'visitor_email',
      COALESCE(p_context->>'channel', 'hosted'), (p_context->>'widget_installation_id')::uuid, p_context->>'source_origin')
    RETURNING id INTO p_conversation_id;
    new_conversation := TRUE;
  END IF;
  INSERT INTO public.agent_chat_requests(owner_id, request_id, visitor_id, fingerprint, question, conversation_id, attempt_id, status, credit_month, expires_at)
  VALUES(p_owner_id, p_request_id, p_visitor_id, p_fingerprint, p_question, p_conversation_id, p_attempt_id, 'pending', month_start, now() + interval '2 minutes')
  ON CONFLICT (owner_id, request_id) DO UPDATE SET attempt_id = p_attempt_id, status = 'pending', credit_month = month_start, expires_at = now() + interval '2 minutes';
  RETURN jsonb_build_object('status', 'reserved', 'conversation_id', p_conversation_id, 'new_conversation', new_conversation);
END;
$$;

CREATE FUNCTION public.finish_agent_chat_request(p_owner_id UUID, p_request_id UUID, p_attempt_id UUID, p_answer TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  req public.agent_chat_requests%ROWTYPE;
  answer_id UUID;
  month_start TIMESTAMPTZ := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  SELECT * INTO req FROM public.agent_chat_requests WHERE owner_id = p_owner_id AND request_id = p_request_id FOR UPDATE;
  IF NOT FOUND OR req.attempt_id <> p_attempt_id THEN RETURN FALSE; END IF;
  IF req.status = 'completed' THEN RETURN p_answer IS NOT NULL; END IF;
  IF req.status <> 'pending' THEN RETURN FALSE; END IF;
  IF p_answer IS NOT NULL AND length(btrim(p_answer)) > 0 AND req.expires_at > now() THEN
    -- Persist both sides and settle the credit in one transaction. Failed
    -- attempts never pollute trusted history with duplicated visitor prompts.
    INSERT INTO public.agent_messages(conversation_id, role, content, created_at)
    VALUES(req.conversation_id, 'user', req.question, now());
    INSERT INTO public.agent_messages(conversation_id, role, content, created_at)
    VALUES(req.conversation_id, 'assistant', p_answer, now() + interval '1 microsecond') RETURNING id INTO answer_id;
    UPDATE public.agent_chat_requests SET status = 'completed', assistant_message_id = answer_id
    WHERE owner_id = p_owner_id AND request_id = p_request_id;
    RETURN TRUE;
  END IF;
  UPDATE public.agent_chat_requests SET status = 'failed' WHERE owner_id = p_owner_id AND request_id = p_request_id;
  IF req.credit_month = month_start AND COALESCE(sub.last_reset_at, sub.created_at, 'epoch'::timestamptz) >= month_start THEN
    UPDATE public.subscriptions SET messages_used = GREATEST(0, messages_used - 1) WHERE user_id = p_owner_id;
  END IF;
  RETURN p_answer IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_agent_chat_request(UUID, UUID, UUID, TEXT, TEXT, TEXT, INTEGER, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_agent_chat_request(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_agent_chat_request(UUID, UUID, UUID, TEXT, TEXT, TEXT, INTEGER, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_agent_chat_request(UUID, UUID, UUID, TEXT) TO service_role;
COMMIT;
