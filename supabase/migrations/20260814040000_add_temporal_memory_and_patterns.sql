-- Phase 4 knowledge fabric: temporal observations, consent-aware preferences,
-- reviewable patterns, and privacy-preserving knowledge-gap intent clusters.

CREATE UNIQUE INDEX IF NOT EXISTS agent_knowledge_gaps_id_user_idx
ON public.agent_knowledge_gaps (id, user_id);

ALTER TABLE public.agent_knowledge_gaps
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(384),
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS embedding_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_error TEXT;

ALTER TABLE public.agent_knowledge_gaps
  DROP CONSTRAINT IF EXISTS agent_knowledge_gaps_embedding_status_check,
  ADD CONSTRAINT agent_knowledge_gaps_embedding_status_check
    CHECK (embedding_status IN ('pending', 'processing', 'complete', 'failed')),
  DROP CONSTRAINT IF EXISTS agent_knowledge_gaps_embedding_attempts_check,
  ADD CONSTRAINT agent_knowledge_gaps_embedding_attempts_check
    CHECK (embedding_attempts BETWEEN 0 AND 5),
  DROP CONSTRAINT IF EXISTS agent_knowledge_gaps_embedding_state_check,
  ADD CONSTRAINT agent_knowledge_gaps_embedding_state_check CHECK (
    (embedding_status = 'complete' AND embedding IS NOT NULL AND embedding_model IS NOT NULL AND embedded_at IS NOT NULL)
    OR (embedding_status <> 'complete' AND embedding IS NULL)
  );

CREATE INDEX IF NOT EXISTS agent_knowledge_gaps_embedding_queue_idx
ON public.agent_knowledge_gaps (embedding_status, embedding_next_retry_at, embedding_attempts, last_seen_at)
WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.agent_memory_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  source_claim_id UUID,
  source_chunk_id UUID,
  source_kind TEXT NOT NULL,
  observation_type TEXT NOT NULL,
  observation_key TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  consent_basis TEXT NOT NULL,
  consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence REAL NOT NULL DEFAULT 1,
  observation_fingerprint TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_memory_observations_entity_fk
    FOREIGN KEY (entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_observations_claim_fk
    FOREIGN KEY (source_claim_id, user_id)
    REFERENCES public.agent_knowledge_claims(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_observations_chunk_fk
    FOREIGN KEY (source_chunk_id, user_id)
    REFERENCES public.agent_knowledge_chunks(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_observations_source_check CHECK (
    (source_kind = 'owner_entry' AND source_claim_id IS NULL)
    OR (source_kind = 'approved_claim' AND source_claim_id IS NOT NULL)
  ),
  CONSTRAINT agent_memory_observations_type_check CHECK (
    observation_type IN ('event', 'state', 'change', 'preference_signal', 'behavior', 'availability')
  ),
  CONSTRAINT agent_memory_observations_text_check CHECK (
    char_length(observation_key) BETWEEN 1 AND 80
    AND char_length(observed_value) BETWEEN 1 AND 1000
    AND char_length(normalized_value) BETWEEN 1 AND 1000
  ),
  CONSTRAINT agent_memory_observations_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_memory_observations_consent_check CHECK (
    consent_basis IN ('owner_explicit', 'approved_source')
  ),
  CONSTRAINT agent_memory_observations_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_memory_observations_dates_check CHECK (
    (valid_until IS NULL OR valid_until > occurred_at)
    AND (expires_at IS NULL OR expires_at > occurred_at)
  ),
  CONSTRAINT agent_memory_observations_fingerprint_check CHECK (observation_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT agent_memory_observations_user_unique UNIQUE (id, user_id),
  CONSTRAINT agent_memory_observations_fingerprint_unique UNIQUE (user_id, observation_fingerprint)
);

CREATE INDEX IF NOT EXISTS agent_memory_observations_owner_entity_time_idx
ON public.agent_memory_observations (user_id, entity_id, occurred_at DESC, evidence_status);

CREATE INDEX IF NOT EXISTS agent_memory_observations_search_idx
ON public.agent_memory_observations USING GIN (
  to_tsvector('simple', observed_value || ' ' || replace(observation_key, '_', ' '))
);

CREATE TABLE IF NOT EXISTS public.agent_memory_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID,
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  consent_basis TEXT NOT NULL,
  support_count INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.5,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  inferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  embedding extensions.vector(384),
  embedding_model TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_memory_patterns_entity_fk
    FOREIGN KEY (entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_patterns_type_check CHECK (
    pattern_type IN ('recurrence', 'preference', 'change', 'intent_cluster')
  ),
  CONSTRAINT agent_memory_patterns_entity_scope_check CHECK (
    (pattern_type = 'intent_cluster' AND entity_id IS NULL)
    OR (pattern_type <> 'intent_cluster' AND entity_id IS NOT NULL)
  ),
  CONSTRAINT agent_memory_patterns_text_check CHECK (
    char_length(pattern_key) BETWEEN 1 AND 160
    AND char_length(title) BETWEEN 1 AND 300
    AND char_length(summary) BETWEEN 1 AND 1200
  ),
  CONSTRAINT agent_memory_patterns_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_memory_patterns_consent_check CHECK (
    consent_basis IN ('owner_explicit', 'approved_source', 'aggregate_anonymous')
  ),
  CONSTRAINT agent_memory_patterns_support_check CHECK (support_count >= 0),
  CONSTRAINT agent_memory_patterns_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_memory_patterns_window_check CHECK (
    window_end IS NULL OR window_start IS NULL OR window_end >= window_start
  ),
  CONSTRAINT agent_memory_patterns_embedding_check CHECK (
    (embedding IS NULL AND embedding_model IS NULL)
    OR (pattern_type = 'intent_cluster' AND embedding IS NOT NULL AND embedding_model IS NOT NULL)
  ),
  CONSTRAINT agent_memory_patterns_user_unique UNIQUE (id, user_id),
  CONSTRAINT agent_memory_patterns_key_unique UNIQUE (user_id, pattern_key)
);

CREATE INDEX IF NOT EXISTS agent_memory_patterns_owner_status_idx
ON public.agent_memory_patterns (user_id, pattern_type, evidence_status, expires_at);

CREATE INDEX IF NOT EXISTS agent_memory_patterns_search_idx
ON public.agent_memory_patterns USING GIN (to_tsvector('simple', title || ' ' || summary));

CREATE INDEX IF NOT EXISTS agent_memory_patterns_intent_hnsw_idx
ON public.agent_memory_patterns USING hnsw (embedding extensions.vector_cosine_ops)
WHERE pattern_type = 'intent_cluster' AND embedding IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.agent_memory_pattern_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL,
  observation_id UUID,
  knowledge_gap_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_memory_pattern_support_pattern_fk
    FOREIGN KEY (pattern_id, user_id)
    REFERENCES public.agent_memory_patterns(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_pattern_support_observation_fk
    FOREIGN KEY (observation_id, user_id)
    REFERENCES public.agent_memory_observations(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_pattern_support_gap_fk
    FOREIGN KEY (knowledge_gap_id, user_id)
    REFERENCES public.agent_knowledge_gaps(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_pattern_support_one_source_check CHECK (
    (observation_id IS NOT NULL)::integer + (knowledge_gap_id IS NOT NULL)::integer = 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_memory_pattern_support_observation_unique
ON public.agent_memory_pattern_support (pattern_id, observation_id)
WHERE observation_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agent_memory_pattern_support_gap_unique
ON public.agent_memory_pattern_support (pattern_id, knowledge_gap_id)
WHERE knowledge_gap_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_memory_pattern_support_owner_idx
ON public.agent_memory_pattern_support (user_id, pattern_id);

CREATE TABLE IF NOT EXISTS public.agent_memory_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  source_pattern_id UUID,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  consent_basis TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'active',
  confidence REAL NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_memory_preferences_entity_fk
    FOREIGN KEY (entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_preferences_pattern_fk
    FOREIGN KEY (source_pattern_id, user_id)
    REFERENCES public.agent_memory_patterns(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_memory_preferences_text_check CHECK (
    char_length(preference_key) BETWEEN 1 AND 80
    AND char_length(preference_value) BETWEEN 1 AND 1000
    AND char_length(normalized_value) BETWEEN 1 AND 1000
  ),
  CONSTRAINT agent_memory_preferences_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_memory_preferences_consent_basis_check CHECK (
    consent_basis IN ('owner_explicit', 'approved_source')
  ),
  CONSTRAINT agent_memory_preferences_consent_status_check CHECK (
    consent_status IN ('active', 'withdrawn')
  ),
  CONSTRAINT agent_memory_preferences_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_memory_preferences_user_unique UNIQUE (id, user_id),
  CONSTRAINT agent_memory_preferences_value_unique UNIQUE (user_id, entity_id, preference_key, normalized_value)
);

CREATE INDEX IF NOT EXISTS agent_memory_preferences_owner_status_idx
ON public.agent_memory_preferences (user_id, entity_id, evidence_status, consent_status, expires_at);

CREATE OR REPLACE FUNCTION public.sync_verified_claim_to_memory_observation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  source_chunk_value UUID;
  observation_type_value TEXT;
  observed_value_value TEXT;
  fingerprint_value TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NEW.evidence_status = 'verified' THEN
    SELECT evidence.source_chunk_id INTO source_chunk_value
    FROM public.agent_knowledge_claim_evidence AS evidence
    WHERE evidence.claim_id = NEW.id AND evidence.evidence_role = 'supports'
    ORDER BY evidence.created_at
    LIMIT 1;

    observation_type_value := CASE
      WHEN NEW.predicate LIKE '%prefer%' THEN 'preference_signal'
      WHEN NEW.predicate IN ('availability', 'status') THEN 'availability'
      WHEN NEW.predicate IN ('changed_to', 'replaced_by', 'became') THEN 'change'
      ELSE 'state'
    END;
    observed_value_value := NEW.statement;
    fingerprint_value := encode(extensions.digest('claim:' || NEW.id::text, 'sha256'), 'hex');

    INSERT INTO public.agent_memory_observations (
      user_id, entity_id, source_claim_id, source_chunk_id, source_kind,
      observation_type, observation_key, observed_value, normalized_value,
      occurred_at, valid_until, expires_at, evidence_status, consent_basis,
      confidence, observation_fingerprint
    ) VALUES (
      NEW.user_id, NEW.subject_entity_id, NEW.id, source_chunk_value, 'approved_claim',
      observation_type_value, NEW.predicate, observed_value_value,
      public.normalize_agent_graph_text(observed_value_value),
      coalesce(NEW.valid_from, NEW.verified_at, now()), NEW.valid_until, NEW.valid_until,
      'verified', 'approved_source', NEW.confidence, fingerprint_value
    )
    ON CONFLICT ON CONSTRAINT agent_memory_observations_fingerprint_unique DO UPDATE
    SET source_chunk_id = excluded.source_chunk_id,
        observation_type = excluded.observation_type,
        observation_key = excluded.observation_key,
        observed_value = excluded.observed_value,
        normalized_value = excluded.normalized_value,
        occurred_at = excluded.occurred_at,
        valid_until = excluded.valid_until,
        expires_at = excluded.expires_at,
        evidence_status = 'verified',
        confidence = excluded.confidence,
        updated_at = now();
  ELSE
    UPDATE public.agent_memory_observations
    SET evidence_status = CASE WHEN evidence_status = 'excluded' THEN 'excluded' ELSE 'unresolved' END,
        updated_at = now()
    WHERE source_claim_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_verified_claim_to_memory_observation_trigger
ON public.agent_knowledge_claims;
CREATE TRIGGER sync_verified_claim_to_memory_observation_trigger
AFTER INSERT OR UPDATE OF evidence_status, verified_at, valid_from, valid_until, statement
ON public.agent_knowledge_claims
FOR EACH ROW EXECUTE FUNCTION public.sync_verified_claim_to_memory_observation();

INSERT INTO public.agent_memory_observations (
  user_id, entity_id, source_claim_id, source_chunk_id, source_kind,
  observation_type, observation_key, observed_value, normalized_value,
  occurred_at, valid_until, expires_at, evidence_status, consent_basis,
  confidence, observation_fingerprint
)
SELECT
  claims.user_id,
  claims.subject_entity_id,
  claims.id,
  evidence.source_chunk_id,
  'approved_claim',
  CASE
    WHEN claims.predicate LIKE '%prefer%' THEN 'preference_signal'
    WHEN claims.predicate IN ('availability', 'status') THEN 'availability'
    WHEN claims.predicate IN ('changed_to', 'replaced_by', 'became') THEN 'change'
    ELSE 'state'
  END,
  claims.predicate,
  claims.statement,
  public.normalize_agent_graph_text(claims.statement),
  coalesce(claims.valid_from, claims.verified_at, now()),
  claims.valid_until,
  claims.valid_until,
  'verified',
  'approved_source',
  claims.confidence,
  encode(extensions.digest('claim:' || claims.id::text, 'sha256'), 'hex')
FROM public.agent_knowledge_claims AS claims
LEFT JOIN LATERAL (
  SELECT source_chunk_id
  FROM public.agent_knowledge_claim_evidence
  WHERE claim_id = claims.id AND evidence_role = 'supports'
  ORDER BY created_at
  LIMIT 1
) evidence ON true
WHERE claims.evidence_status = 'verified'
ON CONFLICT ON CONSTRAINT agent_memory_observations_fingerprint_unique DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_agent_memory_observation(
  p_owner_id UUID,
  p_entity_id UUID,
  p_observation_type TEXT,
  p_observation_key TEXT,
  p_observed_value TEXT,
  p_occurred_at TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  type_value TEXT := lower(trim(coalesce(p_observation_type, '')));
  key_value TEXT := left(trim(both '_' from regexp_replace(lower(trim(coalesce(p_observation_key, ''))), '[^a-z0-9]+', '_', 'g')), 80);
  observed_value_value TEXT := left(trim(coalesce(p_observed_value, '')), 1000);
  normalized_value_value TEXT;
  fingerprint_value TEXT;
  observation_id_value UUID;
BEGIN
  normalized_value_value := left(public.normalize_agent_graph_text(observed_value_value), 1000);
  IF p_owner_id IS NULL
      OR p_entity_id IS NULL
      OR type_value NOT IN ('event', 'state', 'change', 'preference_signal', 'behavior', 'availability')
      OR key_value = ''
      OR observed_value_value = ''
      OR normalized_value_value = ''
      OR p_occurred_at IS NULL
      OR p_occurred_at > now() + interval '5 minutes'
      OR (p_expires_at IS NOT NULL AND (p_expires_at <= p_occurred_at OR p_expires_at <= now())) THEN
    RAISE EXCEPTION 'Invalid memory observation';
  END IF;

  IF (key_value || ' ' || observed_value_value) ~* '(password|passcode|access[_ -]?code|api[_ -]?key|secret[_ -]?key|private[_ -]?key|credit[_ -]?card|card[_ -]?number|cvv|social[_ -]?security|passport[_ -]?(number|id)|national[_ -]?id|bank[_ -]?account)' THEN
    RAISE EXCEPTION 'Sensitive data cannot be stored in memory';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.agent_knowledge_entities
    WHERE id = p_entity_id AND user_id = p_owner_id AND evidence_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Verified memory entity not found';
  END IF;

  fingerprint_value := encode(extensions.digest(
    p_owner_id::text || '|' || p_entity_id::text || '|' || key_value || '|' ||
    normalized_value_value || '|' || p_occurred_at::text,
    'sha256'
  ), 'hex');

  INSERT INTO public.agent_memory_observations (
    user_id, entity_id, source_kind, observation_type, observation_key,
    observed_value, normalized_value, occurred_at, expires_at,
    evidence_status, consent_basis, confidence, observation_fingerprint
  ) VALUES (
    p_owner_id, p_entity_id, 'owner_entry', type_value, key_value,
    observed_value_value, normalized_value_value, p_occurred_at, p_expires_at,
    'verified', 'owner_explicit', 1, fingerprint_value
  )
  ON CONFLICT ON CONSTRAINT agent_memory_observations_fingerprint_unique DO UPDATE
  SET observed_value = excluded.observed_value,
      expires_at = excluded.expires_at,
      evidence_status = 'verified',
      consent_basis = 'owner_explicit',
      consent_recorded_at = now(),
      updated_at = now()
  RETURNING id INTO observation_id_value;

  RETURN observation_id_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_agent_memory_preference(
  p_owner_id UUID,
  p_entity_id UUID,
  p_preference_key TEXT,
  p_preference_value TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  key_value TEXT := left(trim(both '_' from regexp_replace(lower(trim(coalesce(p_preference_key, ''))), '[^a-z0-9]+', '_', 'g')), 80);
  preference_value_value TEXT := left(trim(coalesce(p_preference_value, '')), 1000);
  normalized_value_value TEXT;
  preference_id_value UUID;
BEGIN
  normalized_value_value := left(public.normalize_agent_graph_text(preference_value_value), 1000);
  IF p_owner_id IS NULL OR p_entity_id IS NULL OR key_value = '' OR preference_value_value = ''
      OR normalized_value_value = '' OR (p_expires_at IS NOT NULL AND p_expires_at <= now()) THEN
    RAISE EXCEPTION 'Invalid memory preference';
  END IF;

  IF (key_value || ' ' || preference_value_value) ~* '(password|passcode|access[_ -]?code|api[_ -]?key|secret[_ -]?key|private[_ -]?key|credit[_ -]?card|card[_ -]?number|cvv|social[_ -]?security|passport[_ -]?(number|id)|national[_ -]?id|bank[_ -]?account)' THEN
    RAISE EXCEPTION 'Sensitive data cannot be stored in memory';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.agent_knowledge_entities
    WHERE id = p_entity_id AND user_id = p_owner_id AND evidence_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Verified memory entity not found';
  END IF;

  INSERT INTO public.agent_memory_preferences (
    user_id, entity_id, preference_key, preference_value, normalized_value,
    evidence_status, consent_basis, consent_status, confidence, expires_at, verified_at, reviewed_at
  ) VALUES (
    p_owner_id, p_entity_id, key_value, preference_value_value, normalized_value_value,
    'verified', 'owner_explicit', 'active', 1, p_expires_at, now(), now()
  )
  ON CONFLICT ON CONSTRAINT agent_memory_preferences_value_unique DO UPDATE
  SET preference_value = excluded.preference_value,
      evidence_status = 'verified',
      consent_basis = 'owner_explicit',
      consent_status = 'active',
      confidence = 1,
      expires_at = excluded.expires_at,
      verified_at = now(),
      reviewed_at = now(),
      revoked_at = NULL,
      updated_at = now()
  RETURNING id INTO preference_id_value;

  RETURN preference_id_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_agent_intent_embedding_jobs(
  p_limit INTEGER DEFAULT 12,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE (
  gap_id UUID,
  owner_id UUID,
  question TEXT,
  normalized_question TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  bounded_limit INTEGER := greatest(1, least(coalesce(p_limit, 12), 16));
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT gaps.id
    FROM public.agent_knowledge_gaps AS gaps
    WHERE gaps.status = 'open'
      AND (p_owner_id IS NULL OR gaps.user_id = p_owner_id)
      AND gaps.embedding_attempts < 5
      AND (
        gaps.embedding_status = 'pending'
        OR (gaps.embedding_status = 'failed' AND coalesce(gaps.embedding_next_retry_at, '-infinity'::timestamptz) <= now())
        OR (gaps.embedding_status = 'processing' AND gaps.embedding_started_at < now() - interval '15 minutes')
      )
    ORDER BY gaps.last_seen_at, gaps.id
    FOR UPDATE SKIP LOCKED
    LIMIT bounded_limit
  ), claimed AS (
    UPDATE public.agent_knowledge_gaps AS gaps
    SET embedding_status = 'processing',
        embedding_attempts = gaps.embedding_attempts + 1,
        embedding_started_at = now(),
        embedding_error = NULL
    FROM eligible
    WHERE gaps.id = eligible.id
    RETURNING gaps.id, gaps.user_id, gaps.question, gaps.normalized_question
  )
  SELECT claimed.id, claimed.user_id, claimed.question, claimed.normalized_question
  FROM claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_agent_intent_embeddings(
  p_model TEXT,
  p_embeddings JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  item JSONB;
  item_count INTEGER := 0;
  embedding_value extensions.vector(384);
BEGIN
  IF p_model <> 'gte-small@1'
      OR jsonb_typeof(p_embeddings) <> 'array'
      OR jsonb_array_length(p_embeddings) NOT BETWEEN 1 AND 16 THEN
    RAISE EXCEPTION 'Invalid intent embedding payload';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_embeddings)
  LOOP
    IF jsonb_typeof(item -> 'embedding') <> 'array'
        OR jsonb_array_length(item -> 'embedding') <> 384 THEN
      RAISE EXCEPTION 'Intent embedding must contain 384 dimensions';
    END IF;
    embedding_value := (item -> 'embedding')::text::extensions.vector(384);

    UPDATE public.agent_knowledge_gaps
    SET embedding = embedding_value,
        embedding_model = p_model,
        embedding_status = 'complete',
        embedded_at = now(),
        embedding_started_at = NULL,
        embedding_next_retry_at = NULL,
        embedding_error = NULL
    WHERE id = (item ->> 'id')::uuid
      AND embedding_status = 'processing';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Intent embedding job is stale or invalid';
    END IF;
    item_count := item_count + 1;
  END LOOP;

  RETURN item_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_agent_intent_embedding_jobs(
  p_gap_ids UUID[],
  p_error TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.agent_knowledge_gaps
  SET embedding = NULL,
      embedding_model = NULL,
      embedding_status = 'failed',
      embedding_started_at = NULL,
      embedding_error = left(coalesce(nullif(trim(p_error), ''), 'Intent embedding failed'), 500),
      embedding_next_retry_at = CASE
        WHEN embedding_attempts >= 5 THEN NULL
        ELSE now() + make_interval(mins => least(60, greatest(1, embedding_attempts * embedding_attempts)))
      END
  WHERE id = ANY(coalesce(p_gap_ids, ARRAY[]::uuid[]))
    AND embedding_status = 'processing';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_agent_memory_patterns(
  p_owner_id UUID DEFAULT NULL,
  p_intent_similarity REAL DEFAULT 0.82
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  group_record RECORD;
  gap_record RECORD;
  observation_id_value UUID;
  pattern_id_value UUID;
  pattern_type_value TEXT;
  pattern_key_value TEXT;
  consent_basis_value TEXT;
  nearest_pattern_id UUID;
  nearest_distance REAL;
  preference_id_value UUID;
  observation_patterns INTEGER := 0;
  change_patterns INTEGER := 0;
  intent_patterns INTEGER := 0;
BEGIN
  p_intent_similarity := greatest(0.7, least(coalesce(p_intent_similarity, 0.82), 0.95));

  UPDATE public.agent_memory_observations
  SET evidence_status = 'unresolved', updated_at = now()
  WHERE evidence_status = 'verified'
    AND expires_at IS NOT NULL AND expires_at <= now()
    AND (p_owner_id IS NULL OR user_id = p_owner_id);

  UPDATE public.agent_memory_preferences
  SET evidence_status = 'unresolved', updated_at = now()
  WHERE evidence_status = 'verified'
    AND expires_at IS NOT NULL AND expires_at <= now()
    AND (p_owner_id IS NULL OR user_id = p_owner_id);

  UPDATE public.agent_memory_patterns
  SET evidence_status = 'unresolved', updated_at = now()
  WHERE evidence_status = 'verified'
    AND expires_at IS NOT NULL AND expires_at <= now()
    AND (p_owner_id IS NULL OR user_id = p_owner_id);

  FOR group_record IN
    SELECT
      observations.user_id,
      observations.entity_id,
      observations.observation_type,
      observations.observation_key,
      observations.normalized_value,
      min(observations.occurred_at) AS window_start,
      max(observations.occurred_at) AS window_end,
      count(*)::integer AS occurrences,
      count(DISTINCT observations.occurred_at::date)::integer AS observed_days,
      (array_agg(observations.observed_value ORDER BY observations.occurred_at DESC))[1] AS sample_value,
      array_agg(observations.id) AS support_ids,
      bool_and(observations.consent_basis = 'owner_explicit') AS all_owner_explicit
    FROM public.agent_memory_observations AS observations
    WHERE observations.evidence_status = 'verified'
      AND (observations.expires_at IS NULL OR observations.expires_at > now())
      AND (p_owner_id IS NULL OR observations.user_id = p_owner_id)
    GROUP BY
      observations.user_id, observations.entity_id, observations.observation_type,
      observations.observation_key, observations.normalized_value
    HAVING count(*) >= CASE WHEN observations.observation_type = 'preference_signal' THEN 2 ELSE 3 END
      AND count(DISTINCT observations.occurred_at::date) >= 2
  LOOP
    pattern_type_value := CASE
      WHEN group_record.observation_type = 'preference_signal' THEN 'preference'
      ELSE 'recurrence'
    END;
    consent_basis_value := CASE WHEN group_record.all_owner_explicit THEN 'owner_explicit' ELSE 'approved_source' END;
    pattern_key_value := 'observation:' || encode(extensions.digest(
      group_record.entity_id::text || '|' || group_record.observation_key || '|' || group_record.normalized_value,
      'sha256'
    ), 'hex');

    INSERT INTO public.agent_memory_patterns (
      user_id, entity_id, pattern_type, pattern_key, title, summary,
      evidence_status, consent_basis, support_count, confidence,
      window_start, window_end, inferred_at, expires_at
    ) VALUES (
      group_record.user_id,
      group_record.entity_id,
      pattern_type_value,
      pattern_key_value,
      left(CASE WHEN pattern_type_value = 'preference' THEN 'Possible preference: ' ELSE 'Recurring observation: ' END || group_record.sample_value, 300),
      left('Observed ' || group_record.occurrences || ' times across ' || group_record.observed_days || ' dates. Latest recorded value: ' || group_record.sample_value, 1200),
      'draft',
      consent_basis_value,
      group_record.occurrences,
      least(0.95, 0.45 + group_record.occurrences * 0.1)::real,
      group_record.window_start,
      group_record.window_end,
      now(),
      group_record.window_end + interval '90 days'
    )
    ON CONFLICT ON CONSTRAINT agent_memory_patterns_key_unique DO UPDATE
    SET title = excluded.title,
        summary = excluded.summary,
        consent_basis = excluded.consent_basis,
        support_count = excluded.support_count,
        confidence = excluded.confidence,
        window_start = excluded.window_start,
        window_end = excluded.window_end,
        inferred_at = now(),
        expires_at = excluded.expires_at,
        updated_at = now()
    RETURNING id INTO pattern_id_value;

    FOREACH observation_id_value IN ARRAY group_record.support_ids
    LOOP
      INSERT INTO public.agent_memory_pattern_support (user_id, pattern_id, observation_id)
      VALUES (group_record.user_id, pattern_id_value, observation_id_value)
      ON CONFLICT DO NOTHING;
    END LOOP;

    IF pattern_type_value = 'preference' THEN
      INSERT INTO public.agent_memory_preferences (
        user_id, entity_id, source_pattern_id, preference_key, preference_value,
        normalized_value, evidence_status, consent_basis, consent_status,
        confidence, expires_at
      ) VALUES (
        group_record.user_id, group_record.entity_id, pattern_id_value,
        group_record.observation_key, group_record.sample_value, group_record.normalized_value,
        'draft', consent_basis_value, 'active',
        least(0.95, 0.45 + group_record.occurrences * 0.1)::real,
        group_record.window_end + interval '90 days'
      )
      ON CONFLICT ON CONSTRAINT agent_memory_preferences_value_unique DO UPDATE
      SET source_pattern_id = excluded.source_pattern_id,
          confidence = excluded.confidence,
          expires_at = excluded.expires_at,
          updated_at = now()
      RETURNING id INTO preference_id_value;
    END IF;

    observation_patterns := observation_patterns + 1;
  END LOOP;

  FOR group_record IN
    SELECT
      observations.user_id,
      observations.entity_id,
      observations.observation_key,
      min(observations.occurred_at) AS window_start,
      max(observations.occurred_at) AS window_end,
      count(*)::integer AS occurrences,
      count(DISTINCT observations.normalized_value)::integer AS distinct_values,
      (array_agg(observations.observed_value ORDER BY observations.occurred_at))[1] AS first_value,
      (array_agg(observations.observed_value ORDER BY observations.occurred_at DESC))[1] AS last_value,
      array_agg(observations.id) AS support_ids,
      bool_and(observations.consent_basis = 'owner_explicit') AS all_owner_explicit
    FROM public.agent_memory_observations AS observations
    WHERE observations.evidence_status = 'verified'
      AND observations.observation_type IN ('state', 'change', 'availability')
      AND (observations.expires_at IS NULL OR observations.expires_at > now())
      AND (p_owner_id IS NULL OR observations.user_id = p_owner_id)
    GROUP BY observations.user_id, observations.entity_id, observations.observation_key
    HAVING count(*) >= 2 AND count(DISTINCT observations.normalized_value) >= 2
  LOOP
    consent_basis_value := CASE WHEN group_record.all_owner_explicit THEN 'owner_explicit' ELSE 'approved_source' END;
    pattern_key_value := 'change:' || encode(extensions.digest(
      group_record.entity_id::text || '|' || group_record.observation_key,
      'sha256'
    ), 'hex');

    INSERT INTO public.agent_memory_patterns (
      user_id, entity_id, pattern_type, pattern_key, title, summary,
      evidence_status, consent_basis, support_count, confidence,
      window_start, window_end, inferred_at, expires_at
    ) VALUES (
      group_record.user_id,
      group_record.entity_id,
      'change',
      pattern_key_value,
      left('Recorded change in ' || replace(group_record.observation_key, '_', ' '), 300),
      left('Recorded value changed from "' || group_record.first_value || '" to "' || group_record.last_value || '" across ' || group_record.occurrences || ' observations.', 1200),
      'draft',
      consent_basis_value,
      group_record.occurrences,
      least(0.95, 0.5 + group_record.occurrences * 0.08)::real,
      group_record.window_start,
      group_record.window_end,
      now(),
      group_record.window_end + interval '90 days'
    )
    ON CONFLICT ON CONSTRAINT agent_memory_patterns_key_unique DO UPDATE
    SET title = excluded.title,
        summary = excluded.summary,
        consent_basis = excluded.consent_basis,
        support_count = excluded.support_count,
        confidence = excluded.confidence,
        window_start = excluded.window_start,
        window_end = excluded.window_end,
        inferred_at = now(),
        expires_at = excluded.expires_at,
        updated_at = now()
    RETURNING id INTO pattern_id_value;

    FOREACH observation_id_value IN ARRAY group_record.support_ids
    LOOP
      INSERT INTO public.agent_memory_pattern_support (user_id, pattern_id, observation_id)
      VALUES (group_record.user_id, pattern_id_value, observation_id_value)
      ON CONFLICT DO NOTHING;
    END LOOP;
    change_patterns := change_patterns + 1;
  END LOOP;

  FOR gap_record IN
    SELECT gaps.*
    FROM public.agent_knowledge_gaps AS gaps
    WHERE gaps.status = 'open'
      AND (p_owner_id IS NULL OR gaps.user_id = p_owner_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.agent_memory_pattern_support AS support
        WHERE support.knowledge_gap_id = gaps.id
      )
    ORDER BY gaps.created_at, gaps.id
  LOOP
    nearest_pattern_id := NULL;
    nearest_distance := NULL;
    IF gap_record.embedding IS NOT NULL AND gap_record.embedding_model = 'gte-small@1' THEN
      SELECT patterns.id, (patterns.embedding <=> gap_record.embedding)::real
      INTO nearest_pattern_id, nearest_distance
      FROM public.agent_memory_patterns AS patterns
      WHERE patterns.user_id = gap_record.user_id
        AND patterns.pattern_type = 'intent_cluster'
        AND patterns.evidence_status <> 'excluded'
        AND patterns.embedding_model = 'gte-small@1'
        AND patterns.embedding IS NOT NULL
      ORDER BY patterns.embedding <=> gap_record.embedding
      LIMIT 1;
    END IF;

    IF nearest_pattern_id IS NULL OR nearest_distance > (1 - p_intent_similarity) THEN
      pattern_key_value := 'intent:' || encode(extensions.digest(gap_record.id::text, 'sha256'), 'hex');
      INSERT INTO public.agent_memory_patterns (
        user_id, pattern_type, pattern_key, title, summary,
        evidence_status, consent_basis, support_count, confidence,
        window_start, window_end, inferred_at, expires_at, embedding, embedding_model
      ) VALUES (
        gap_record.user_id,
        'intent_cluster',
        pattern_key_value,
        left(gap_record.question, 300),
        left('Visitors have repeatedly asked about: ' || gap_record.question, 1200),
        'draft',
        'aggregate_anonymous',
        gap_record.occurrence_count,
        least(0.95, 0.4 + gap_record.occurrence_count * 0.1)::real,
        gap_record.created_at,
        gap_record.last_seen_at,
        now(),
        gap_record.last_seen_at + interval '180 days',
        gap_record.embedding,
        gap_record.embedding_model
      )
      ON CONFLICT ON CONSTRAINT agent_memory_patterns_key_unique DO UPDATE
      SET support_count = excluded.support_count,
          confidence = excluded.confidence,
          window_end = excluded.window_end,
          expires_at = excluded.expires_at,
          embedding = coalesce(public.agent_memory_patterns.embedding, excluded.embedding),
          embedding_model = coalesce(public.agent_memory_patterns.embedding_model, excluded.embedding_model),
          updated_at = now()
      RETURNING id INTO pattern_id_value;
    ELSE
      pattern_id_value := nearest_pattern_id;
    END IF;

    INSERT INTO public.agent_memory_pattern_support (user_id, pattern_id, knowledge_gap_id)
    VALUES (gap_record.user_id, pattern_id_value, gap_record.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.agent_memory_patterns AS patterns
  SET support_count = aggregates.occurrences,
      confidence = least(0.95, 0.4 + aggregates.occurrences * 0.08)::real,
      window_start = aggregates.first_seen,
      window_end = aggregates.last_seen,
      expires_at = aggregates.last_seen + interval '180 days',
      summary = left('Visitors asked ' || aggregates.occurrences || ' times across ' || aggregates.distinct_questions || ' semantically grouped questions. Representative question: ' || patterns.title, 1200),
      updated_at = now()
  FROM (
    SELECT
      support.pattern_id,
      sum(gaps.occurrence_count)::integer AS occurrences,
      count(DISTINCT gaps.id)::integer AS distinct_questions,
      min(gaps.created_at) AS first_seen,
      max(gaps.last_seen_at) AS last_seen
    FROM public.agent_memory_pattern_support AS support
    JOIN public.agent_knowledge_gaps AS gaps
      ON gaps.id = support.knowledge_gap_id AND gaps.status = 'open'
    GROUP BY support.pattern_id
  ) AS aggregates
  WHERE patterns.id = aggregates.pattern_id
    AND patterns.pattern_type = 'intent_cluster'
    AND (p_owner_id IS NULL OR patterns.user_id = p_owner_id);

  UPDATE public.agent_memory_patterns AS patterns
  SET support_count = current_support.support_count,
      evidence_status = CASE
        WHEN patterns.evidence_status = 'verified'
          AND current_support.support_count < CASE WHEN patterns.pattern_type = 'recurrence' THEN 3 ELSE 2 END
        THEN 'unresolved'
        ELSE patterns.evidence_status
      END,
      updated_at = now()
  FROM (
    SELECT
      pattern.id,
      count(observations.id) FILTER (
        WHERE observations.evidence_status = 'verified'
          AND (observations.expires_at IS NULL OR observations.expires_at > now())
      )::integer AS support_count
    FROM public.agent_memory_patterns AS pattern
    LEFT JOIN public.agent_memory_pattern_support AS support ON support.pattern_id = pattern.id
    LEFT JOIN public.agent_memory_observations AS observations ON observations.id = support.observation_id
    WHERE pattern.pattern_type IN ('recurrence', 'preference', 'change')
      AND (p_owner_id IS NULL OR pattern.user_id = p_owner_id)
    GROUP BY pattern.id
  ) AS current_support
  WHERE patterns.id = current_support.id;

  UPDATE public.agent_memory_patterns AS patterns
  SET support_count = current_support.occurrences,
      evidence_status = CASE
        WHEN patterns.evidence_status = 'verified' AND current_support.occurrences < 2 THEN 'unresolved'
        ELSE patterns.evidence_status
      END,
      updated_at = now()
  FROM (
    SELECT
      pattern.id,
      coalesce(sum(gaps.occurrence_count) FILTER (WHERE gaps.status = 'open'), 0)::integer AS occurrences
    FROM public.agent_memory_patterns AS pattern
    LEFT JOIN public.agent_memory_pattern_support AS support ON support.pattern_id = pattern.id
    LEFT JOIN public.agent_knowledge_gaps AS gaps ON gaps.id = support.knowledge_gap_id
    WHERE pattern.pattern_type = 'intent_cluster'
      AND (p_owner_id IS NULL OR pattern.user_id = p_owner_id)
    GROUP BY pattern.id
  ) AS current_support
  WHERE patterns.id = current_support.id;

  SELECT count(*)::integer INTO intent_patterns
  FROM public.agent_memory_patterns
  WHERE pattern_type = 'intent_cluster'
    AND support_count >= 2
    AND (p_owner_id IS NULL OR user_id = p_owner_id);

  RETURN jsonb_build_object(
    'observation_patterns', observation_patterns,
    'change_patterns', change_patterns,
    'intent_patterns', intent_patterns
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_agent_memory_item(
  p_owner_id UUID,
  p_item_type TEXT,
  p_item_id UUID,
  p_decision TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  item_type_value TEXT := lower(trim(coalesce(p_item_type, '')));
  decision_value TEXT := lower(trim(coalesce(p_decision, '')));
  note_value TEXT := nullif(left(trim(coalesce(p_review_note, '')), 1000), '');
  selected_pattern public.agent_memory_patterns%ROWTYPE;
  minimum_support INTEGER;
BEGIN
  IF item_type_value NOT IN ('pattern', 'preference', 'observation')
      OR decision_value NOT IN ('approve', 'reject', 'revoke') THEN
    RAISE EXCEPTION 'Invalid memory review action';
  END IF;

  IF item_type_value = 'pattern' THEN
    IF decision_value = 'revoke' THEN RAISE EXCEPTION 'Patterns must be rejected rather than revoked'; END IF;
    SELECT * INTO selected_pattern
    FROM public.agent_memory_patterns
    WHERE id = p_item_id AND user_id = p_owner_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Memory pattern not found'; END IF;

    IF decision_value = 'approve' THEN
      minimum_support := CASE WHEN selected_pattern.pattern_type = 'recurrence' THEN 3 ELSE 2 END;
      IF selected_pattern.support_count < minimum_support
          OR (selected_pattern.expires_at IS NOT NULL AND selected_pattern.expires_at <= now()) THEN
        RAISE EXCEPTION 'Memory pattern does not have enough current support';
      END IF;
      UPDATE public.agent_memory_patterns
      SET evidence_status = 'verified', reviewed_at = now(), review_note = note_value, updated_at = now()
      WHERE id = p_item_id AND user_id = p_owner_id;
    ELSE
      UPDATE public.agent_memory_patterns
      SET evidence_status = 'excluded', reviewed_at = now(), review_note = note_value, updated_at = now()
      WHERE id = p_item_id AND user_id = p_owner_id;
    END IF;
  ELSIF item_type_value = 'preference' THEN
    IF decision_value = 'approve' THEN
      UPDATE public.agent_memory_preferences
      SET evidence_status = 'verified', consent_status = 'active', verified_at = now(),
          reviewed_at = now(), revoked_at = NULL, review_note = note_value, updated_at = now()
      WHERE id = p_item_id AND user_id = p_owner_id
        AND (expires_at IS NULL OR expires_at > now());
    ELSIF decision_value = 'revoke' THEN
      UPDATE public.agent_memory_preferences
      SET evidence_status = 'unresolved', consent_status = 'withdrawn',
          revoked_at = now(), reviewed_at = now(), review_note = note_value, updated_at = now()
      WHERE id = p_item_id AND user_id = p_owner_id;
    ELSE
      UPDATE public.agent_memory_preferences
      SET evidence_status = 'excluded', reviewed_at = now(), review_note = note_value, updated_at = now()
      WHERE id = p_item_id AND user_id = p_owner_id;
    END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'Memory preference not found or expired'; END IF;
  ELSE
    IF decision_value = 'revoke' THEN RAISE EXCEPTION 'Observations must be rejected rather than revoked'; END IF;
    UPDATE public.agent_memory_observations
    SET evidence_status = CASE WHEN decision_value = 'approve' THEN 'verified' ELSE 'excluded' END,
        reviewed_at = now(), review_note = note_value, updated_at = now()
    WHERE id = p_item_id AND user_id = p_owner_id
      AND (expires_at IS NULL OR expires_at > now());
    IF NOT FOUND THEN RAISE EXCEPTION 'Memory observation not found or expired'; END IF;
  END IF;

  RETURN jsonb_build_object(
    'item_type', item_type_value,
    'item_id', p_item_id,
    'status', CASE
      WHEN decision_value = 'approve' THEN 'verified'
      WHEN decision_value = 'reject' THEN 'excluded'
      ELSE 'revoked'
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_agent_temporal_memory(
  p_owner_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  memory_id UUID,
  memory_kind TEXT,
  title TEXT,
  content TEXT,
  entity_name TEXT,
  occurred_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  support_count INTEGER,
  confidence REAL,
  consent_basis TEXT,
  retrieval_rank REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH query_data AS (
    SELECT
      public.normalize_agent_graph_text(left(trim(coalesce(p_query, '')), 2000)) AS normalized_query,
      websearch_to_tsquery('simple', left(trim(coalesce(p_query, '')), 2000)) AS query_terms
  ), pattern_matches AS (
    SELECT
      patterns.id,
      'pattern'::text AS memory_kind,
      patterns.title,
      patterns.summary AS content,
      entities.canonical_name AS entity_name,
      patterns.window_end AS occurred_at,
      patterns.expires_at,
      patterns.support_count,
      patterns.confidence,
      patterns.consent_basis,
      (1.0 + least(patterns.support_count, 10) * 0.04 + patterns.confidence * 0.1)::real AS retrieval_rank
    FROM public.agent_memory_patterns AS patterns
    JOIN public.agent_knowledge_entities AS entities
      ON entities.id = patterns.entity_id AND entities.user_id = patterns.user_id
    CROSS JOIN query_data
    WHERE patterns.user_id = p_owner_id
      AND patterns.pattern_type <> 'intent_cluster'
      AND patterns.evidence_status = 'verified'
      AND patterns.support_count >= 2
      AND (patterns.expires_at IS NULL OR patterns.expires_at > now())
      AND (
        to_tsvector('simple', patterns.title || ' ' || patterns.summary) @@ query_data.query_terms
        OR position(entities.normalized_name in query_data.normalized_query) > 0
      )
  ), preference_matches AS (
    SELECT
      preferences.id,
      'preference'::text,
      ('Approved preference: ' || replace(preferences.preference_key, '_', ' '))::text,
      (entities.canonical_name || ' prefers ' || preferences.preference_value || '.')::text,
      entities.canonical_name,
      preferences.verified_at,
      preferences.expires_at,
      1,
      preferences.confidence,
      preferences.consent_basis,
      (1.15 + preferences.confidence * 0.1)::real
    FROM public.agent_memory_preferences AS preferences
    JOIN public.agent_knowledge_entities AS entities
      ON entities.id = preferences.entity_id AND entities.user_id = preferences.user_id
    CROSS JOIN query_data
    WHERE preferences.user_id = p_owner_id
      AND preferences.evidence_status = 'verified'
      AND preferences.consent_status = 'active'
      AND (preferences.expires_at IS NULL OR preferences.expires_at > now())
      AND (
        to_tsvector('simple', preferences.preference_key || ' ' || preferences.preference_value) @@ query_data.query_terms
        OR position(entities.normalized_name in query_data.normalized_query) > 0
      )
  ), observation_matches AS (
    SELECT
      observations.id,
      'observation'::text,
      ('Dated observation: ' || replace(observations.observation_key, '_', ' '))::text,
      observations.observed_value,
      entities.canonical_name,
      observations.occurred_at,
      observations.expires_at,
      1,
      observations.confidence,
      observations.consent_basis,
      (0.9 + observations.confidence * 0.1)::real
    FROM public.agent_memory_observations AS observations
    JOIN public.agent_knowledge_entities AS entities
      ON entities.id = observations.entity_id AND entities.user_id = observations.user_id
    CROSS JOIN query_data
    WHERE observations.user_id = p_owner_id
      AND observations.evidence_status = 'verified'
      AND (observations.expires_at IS NULL OR observations.expires_at > now())
      AND (
        to_tsvector('simple', observations.observed_value || ' ' || replace(observations.observation_key, '_', ' ')) @@ query_data.query_terms
        OR position(entities.normalized_name in query_data.normalized_query) > 0
      )
  )
  SELECT * FROM (
    SELECT * FROM pattern_matches
    UNION ALL
    SELECT * FROM preference_matches
    UNION ALL
    SELECT * FROM observation_matches
  ) matches
  ORDER BY 11 DESC, 6 DESC NULLS LAST, 1
  LIMIT greatest(1, least(coalesce(p_limit, 10), 20));
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agent_memory_observations',
    'agent_memory_patterns',
    'agent_memory_pattern_support',
    'agent_memory_preferences'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Owners read their own temporal memory" ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY "Owners read their own temporal memory" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)',
      table_name
    );
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_verified_claim_to_memory_observation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_agent_memory_observation(UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_agent_memory_preference(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_agent_intent_embedding_jobs(INTEGER, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.store_agent_intent_embeddings(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_agent_intent_embedding_jobs(UUID[], TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_agent_memory_patterns(UUID, REAL) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_agent_memory_item(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_agent_temporal_memory(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_agent_memory_observation(UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_agent_memory_preference(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_agent_intent_embedding_jobs(INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_agent_intent_embeddings(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_agent_intent_embedding_jobs(UUID[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_agent_memory_patterns(UUID, REAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_agent_memory_item(UUID, TEXT, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_agent_temporal_memory(UUID, TEXT, INTEGER) TO service_role;

COMMENT ON TABLE public.agent_memory_observations IS
  'Dated owner-entered or approved-source observations. Raw visitor conversations are never ingested into this table.';
COMMENT ON TABLE public.agent_memory_patterns IS
  'Reviewable temporal inferences with support counts, confidence, windows, and expiry. Intent clusters are aggregate-only and never enter chat retrieval.';
COMMENT ON TABLE public.agent_memory_preferences IS
  'Consent-aware owner or business preferences. Only verified, active, unexpired preferences enter retrieval.';
COMMENT ON FUNCTION public.search_agent_temporal_memory(UUID, TEXT, INTEGER) IS
  'Service-only tenant-scoped retrieval for verified temporal observations, approved patterns, and active preferences.';
