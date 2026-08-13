-- Phase 3 knowledge fabric: canonical entities, atomic source-backed claims,
-- typed relationships, contradiction review, and verified-only graph retrieval.

ALTER TABLE public.agent_knowledge_chunks
  ADD COLUMN IF NOT EXISTS graph_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS graph_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS graph_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graph_indexed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graph_next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graph_error TEXT;

ALTER TABLE public.agent_knowledge_chunks
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_graph_status_check,
  ADD CONSTRAINT agent_knowledge_chunks_graph_status_check
    CHECK (graph_status IN ('pending', 'processing', 'complete', 'failed')),
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_graph_attempts_check,
  ADD CONSTRAINT agent_knowledge_chunks_graph_attempts_check
    CHECK (graph_attempts BETWEEN 0 AND 5),
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_graph_state_check,
  ADD CONSTRAINT agent_knowledge_chunks_graph_state_check CHECK (
    (graph_status = 'complete' AND graph_indexed_at IS NOT NULL AND graph_error IS NULL)
    OR graph_status <> 'complete'
  );

CREATE INDEX IF NOT EXISTS agent_knowledge_chunks_graph_queue_idx
ON public.agent_knowledge_chunks (
  graph_status,
  graph_next_retry_at,
  graph_attempts,
  source_updated_at
)
WHERE is_active = true AND evidence_status = 'verified';

CREATE UNIQUE INDEX IF NOT EXISTS agent_knowledge_chunks_id_user_idx
ON public.agent_knowledge_chunks (id, user_id);

CREATE OR REPLACE FUNCTION public.normalize_agent_graph_text(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
RETURNS NULL ON NULL INPUT
SET search_path = pg_catalog
AS $$
  SELECT trim(regexp_replace(lower(value), '[^[:alnum:]]+', ' ', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.is_agent_graph_single_valued_predicate(value TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
RETURNS NULL ON NULL INPUT
SET search_path = pg_catalog
AS $$
  SELECT value = ANY(ARRAY[
    'cost', 'costs', 'price', 'priced_at',
    'phone', 'phone_number', 'email', 'email_address', 'website',
    'address', 'location', 'located_at',
    'date', 'start_date', 'end_date', 'starts_at', 'ends_at',
    'status', 'version', 'availability',
    'cancellation_notice', 'requires_notice'
  ]::text[])
$$;

CREATE TABLE IF NOT EXISTS public.agent_knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  description TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  confidence REAL NOT NULL DEFAULT 0.5,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_entities_name_check
    CHECK (char_length(canonical_name) BETWEEN 1 AND 200 AND char_length(normalized_name) BETWEEN 1 AND 200),
  CONSTRAINT agent_knowledge_entities_type_check CHECK (
    entity_type IN ('person', 'organization', 'service', 'product', 'place', 'event', 'policy', 'concept', 'date', 'other')
  ),
  CONSTRAINT agent_knowledge_entities_evidence_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_knowledge_entities_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_knowledge_entities_user_unique UNIQUE (id, user_id),
  CONSTRAINT agent_knowledge_entities_canonical_unique UNIQUE (user_id, entity_type, normalized_name)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_entities_owner_name_idx
ON public.agent_knowledge_entities (user_id, normalized_name, entity_type);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_entity_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  source_chunk_id UUID NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_entity_aliases_entity_fk
    FOREIGN KEY (entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_entity_aliases_chunk_fk
    FOREIGN KEY (source_chunk_id, user_id)
    REFERENCES public.agent_knowledge_chunks(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_entity_aliases_value_check
    CHECK (char_length(alias) BETWEEN 1 AND 200 AND char_length(normalized_alias) BETWEEN 1 AND 200),
  CONSTRAINT agent_knowledge_entity_aliases_evidence_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_knowledge_entity_aliases_unique UNIQUE (user_id, entity_id, normalized_alias, source_chunk_id)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_entity_aliases_owner_name_idx
ON public.agent_knowledge_entity_aliases (user_id, normalized_alias);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_entity_id UUID NOT NULL,
  predicate TEXT NOT NULL,
  object_entity_id UUID,
  object_value TEXT,
  object_key TEXT NOT NULL,
  statement TEXT NOT NULL,
  claim_fingerprint TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  confidence REAL NOT NULL DEFAULT 0.5,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_claims_subject_fk
    FOREIGN KEY (subject_entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_claims_object_fk
    FOREIGN KEY (object_entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_claims_object_check CHECK (
    (object_entity_id IS NOT NULL AND object_value IS NULL)
    OR (object_entity_id IS NULL AND object_value IS NOT NULL)
  ),
  CONSTRAINT agent_knowledge_claims_text_check CHECK (
    char_length(predicate) BETWEEN 1 AND 80
    AND char_length(statement) BETWEEN 1 AND 600
    AND char_length(object_key) BETWEEN 1 AND 240
    AND (object_value IS NULL OR char_length(object_value) BETWEEN 1 AND 500)
  ),
  CONSTRAINT agent_knowledge_claims_fingerprint_check CHECK (claim_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT agent_knowledge_claims_evidence_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded', 'superseded')
  ),
  CONSTRAINT agent_knowledge_claims_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_knowledge_claims_validity_check CHECK (
    valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from
  ),
  CONSTRAINT agent_knowledge_claims_user_unique UNIQUE (id, user_id),
  CONSTRAINT agent_knowledge_claims_fingerprint_unique UNIQUE (user_id, claim_fingerprint)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_claims_owner_subject_idx
ON public.agent_knowledge_claims (user_id, subject_entity_id, predicate, evidence_status);

CREATE INDEX IF NOT EXISTS agent_knowledge_claims_owner_object_idx
ON public.agent_knowledge_claims (user_id, object_entity_id, evidence_status)
WHERE object_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_knowledge_claims_search_idx
ON public.agent_knowledge_claims USING GIN (
  to_tsvector('simple', statement || ' ' || replace(predicate, '_', ' '))
);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_claim_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL,
  source_chunk_id UUID NOT NULL,
  evidence_role TEXT NOT NULL DEFAULT 'supports',
  excerpt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_claim_evidence_claim_fk
    FOREIGN KEY (claim_id, user_id)
    REFERENCES public.agent_knowledge_claims(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_claim_evidence_chunk_fk
    FOREIGN KEY (source_chunk_id, user_id)
    REFERENCES public.agent_knowledge_chunks(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_claim_evidence_role_check CHECK (evidence_role IN ('supports', 'contradicts')),
  CONSTRAINT agent_knowledge_claim_evidence_excerpt_check CHECK (char_length(excerpt) BETWEEN 1 AND 500),
  CONSTRAINT agent_knowledge_claim_evidence_unique UNIQUE (claim_id, source_chunk_id, evidence_role)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_claim_evidence_owner_claim_idx
ON public.agent_knowledge_claim_evidence (user_id, claim_id, evidence_role);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_entity_id UUID NOT NULL,
  relation_type TEXT NOT NULL,
  to_entity_id UUID NOT NULL,
  claim_id UUID NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'draft',
  confidence REAL NOT NULL DEFAULT 0.5,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_relationships_from_fk
    FOREIGN KEY (from_entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_relationships_to_fk
    FOREIGN KEY (to_entity_id, user_id)
    REFERENCES public.agent_knowledge_entities(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_relationships_claim_fk
    FOREIGN KEY (claim_id, user_id)
    REFERENCES public.agent_knowledge_claims(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_relationships_distinct_check CHECK (from_entity_id <> to_entity_id),
  CONSTRAINT agent_knowledge_relationships_type_check CHECK (char_length(relation_type) BETWEEN 1 AND 80),
  CONSTRAINT agent_knowledge_relationships_evidence_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded', 'superseded')
  ),
  CONSTRAINT agent_knowledge_relationships_confidence_check CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT agent_knowledge_relationships_validity_check CHECK (
    valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from
  ),
  CONSTRAINT agent_knowledge_relationships_claim_unique UNIQUE (claim_id)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_relationships_owner_from_idx
ON public.agent_knowledge_relationships (user_id, from_entity_id, evidence_status);

CREATE INDEX IF NOT EXISTS agent_knowledge_relationships_owner_to_idx
ON public.agent_knowledge_relationships (user_id, to_entity_id, evidence_status);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  left_claim_id UUID NOT NULL,
  right_claim_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  resolution_note TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT agent_knowledge_contradictions_left_fk
    FOREIGN KEY (left_claim_id, user_id)
    REFERENCES public.agent_knowledge_claims(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_contradictions_right_fk
    FOREIGN KEY (right_claim_id, user_id)
    REFERENCES public.agent_knowledge_claims(id, user_id) ON DELETE CASCADE,
  CONSTRAINT agent_knowledge_contradictions_order_check CHECK (left_claim_id < right_claim_id),
  CONSTRAINT agent_knowledge_contradictions_status_check CHECK (status IN ('open', 'resolved', 'dismissed')),
  CONSTRAINT agent_knowledge_contradictions_reason_check CHECK (char_length(reason) BETWEEN 1 AND 500),
  CONSTRAINT agent_knowledge_contradictions_pair_unique UNIQUE (left_claim_id, right_claim_id)
);

CREATE INDEX IF NOT EXISTS agent_knowledge_contradictions_owner_status_idx
ON public.agent_knowledge_contradictions (user_id, status, detected_at DESC);

CREATE OR REPLACE FUNCTION public.claim_agent_knowledge_graph_jobs(
  p_limit INTEGER DEFAULT 6,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  owner_id UUID,
  source_title TEXT,
  content TEXT,
  content_hash TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  bounded_limit INTEGER := greatest(1, least(coalesce(p_limit, 6), 12));
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT chunks.id
    FROM public.agent_knowledge_chunks AS chunks
    WHERE chunks.is_active = true
      AND chunks.evidence_status = 'verified'
      AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
      AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
      AND (p_owner_id IS NULL OR chunks.user_id = p_owner_id)
      AND chunks.graph_attempts < 5
      AND (
        chunks.graph_status = 'pending'
        OR (chunks.graph_status = 'failed' AND coalesce(chunks.graph_next_retry_at, '-infinity'::timestamptz) <= now())
        OR (chunks.graph_status = 'processing' AND chunks.graph_started_at < now() - interval '15 minutes')
      )
    ORDER BY chunks.source_updated_at, chunks.id
    FOR UPDATE SKIP LOCKED
    LIMIT bounded_limit
  ), claimed AS (
    UPDATE public.agent_knowledge_chunks AS chunks
    SET graph_status = 'processing',
        graph_attempts = chunks.graph_attempts + 1,
        graph_started_at = now(),
        graph_error = NULL
    FROM eligible
    WHERE chunks.id = eligible.id
    RETURNING chunks.id, chunks.user_id, chunks.source_title, chunks.content, chunks.content_hash
  )
  SELECT claimed.id, claimed.user_id, claimed.source_title, claimed.content, claimed.content_hash
  FROM claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_agent_knowledge_graph_extraction(
  p_chunk_id UUID,
  p_content_hash TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  source_chunk public.agent_knowledge_chunks%ROWTYPE;
  entity_item JSONB;
  alias_value JSONB;
  claim_item JSONB;
  entity_map JSONB := '{}'::jsonb;
  temp_id TEXT;
  canonical_name TEXT;
  normalized_name TEXT;
  entity_type_value TEXT;
  entity_id_value UUID;
  subject_id_value UUID;
  object_id_value UUID;
  object_value_text TEXT;
  object_key_value TEXT;
  predicate_value TEXT;
  statement_value TEXT;
  excerpt_value TEXT;
  fingerprint_value TEXT;
  claim_id_value UUID;
  claim_status_value TEXT;
  confidence_value REAL;
  entity_count INTEGER := 0;
  claim_count INTEGER := 0;
  contradiction_count INTEGER := 0;
  inserted_contradictions INTEGER := 0;
  conflicting_claim RECORD;
  left_id UUID;
  right_id UUID;
BEGIN
  SELECT * INTO source_chunk
  FROM public.agent_knowledge_chunks
  WHERE id = p_chunk_id
  FOR UPDATE;

  IF NOT FOUND
      OR source_chunk.graph_status <> 'processing'
      OR source_chunk.content_hash <> p_content_hash
      OR source_chunk.evidence_status <> 'verified'
      OR source_chunk.is_active <> true THEN
    RAISE EXCEPTION 'Knowledge graph job is stale or invalid';
  END IF;

  IF jsonb_typeof(p_payload) <> 'object'
      OR jsonb_typeof(p_payload -> 'entities') <> 'array'
      OR jsonb_typeof(p_payload -> 'claims') <> 'array'
      OR jsonb_array_length(p_payload -> 'entities') > 16
      OR jsonb_array_length(p_payload -> 'claims') > 16 THEN
    RAISE EXCEPTION 'Invalid or oversized knowledge graph payload';
  END IF;

  FOR entity_item IN SELECT value FROM jsonb_array_elements(p_payload -> 'entities')
  LOOP
    temp_id := trim(coalesce(entity_item ->> 'id', ''));
    canonical_name := left(trim(coalesce(entity_item ->> 'name', '')), 200);
    normalized_name := public.normalize_agent_graph_text(canonical_name);
    entity_type_value := lower(trim(coalesce(entity_item ->> 'type', 'other')));
    confidence_value := greatest(0, least(1, coalesce((entity_item ->> 'confidence')::real, 0.5)));

    IF temp_id !~ '^[A-Za-z0-9_-]{1,50}$'
        OR canonical_name = ''
        OR normalized_name = ''
        OR position(lower(canonical_name) in lower(source_chunk.content)) = 0
        OR entity_type_value NOT IN ('person', 'organization', 'service', 'product', 'place', 'event', 'policy', 'concept', 'date', 'other') THEN
      RAISE EXCEPTION 'Invalid entity in knowledge graph payload';
    END IF;

    INSERT INTO public.agent_knowledge_entities (
      user_id, canonical_name, normalized_name, entity_type, description, confidence
    ) VALUES (
      source_chunk.user_id,
      canonical_name,
      normalized_name,
      entity_type_value,
      nullif(left(trim(coalesce(entity_item ->> 'description', '')), 500), ''),
      confidence_value
    )
    ON CONFLICT ON CONSTRAINT agent_knowledge_entities_canonical_unique DO UPDATE
    SET last_seen_at = now(),
        updated_at = now(),
        confidence = greatest(public.agent_knowledge_entities.confidence, excluded.confidence),
        description = coalesce(public.agent_knowledge_entities.description, excluded.description)
    RETURNING id INTO entity_id_value;

    entity_map := entity_map || jsonb_build_object(temp_id, entity_id_value::text);
    entity_count := entity_count + 1;

    IF jsonb_typeof(entity_item -> 'aliases') = 'array' THEN
      FOR alias_value IN SELECT value FROM jsonb_array_elements(entity_item -> 'aliases') LIMIT 8
      LOOP
        canonical_name := left(trim(alias_value #>> '{}'), 200);
        normalized_name := public.normalize_agent_graph_text(canonical_name);
        IF canonical_name <> '' AND normalized_name <> ''
            AND position(lower(canonical_name) in lower(source_chunk.content)) > 0
            AND normalized_name <> public.normalize_agent_graph_text(entity_item ->> 'name') THEN
          INSERT INTO public.agent_knowledge_entity_aliases (
            user_id, entity_id, source_chunk_id, alias, normalized_alias
          ) VALUES (
            source_chunk.user_id, entity_id_value, source_chunk.id, canonical_name, normalized_name
          )
          ON CONFLICT ON CONSTRAINT agent_knowledge_entity_aliases_unique DO UPDATE
          SET updated_at = now();
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  FOR claim_item IN SELECT value FROM jsonb_array_elements(p_payload -> 'claims')
  LOOP
    subject_id_value := nullif(entity_map ->> trim(coalesce(claim_item ->> 'subject_id', '')), '')::uuid;
    object_id_value := nullif(entity_map ->> trim(coalesce(claim_item ->> 'object_entity_id', '')), '')::uuid;
    object_value_text := nullif(left(trim(coalesce(claim_item ->> 'object_value', '')), 500), '');
    predicate_value := left(trim(both '_' from regexp_replace(
      lower(trim(coalesce(claim_item ->> 'predicate', ''))), '[^a-z0-9]+', '_', 'g'
    )), 80);
    statement_value := left(trim(coalesce(claim_item ->> 'statement', '')), 600);
    excerpt_value := left(trim(coalesce(claim_item ->> 'excerpt', statement_value)), 500);
    confidence_value := greatest(0, least(1, coalesce((claim_item ->> 'confidence')::real, 0.5)));

    IF subject_id_value IS NULL
        OR predicate_value = ''
        OR statement_value = ''
        OR excerpt_value = ''
        OR position(lower(excerpt_value) in lower(source_chunk.content)) = 0
        OR ((object_id_value IS NULL) = (object_value_text IS NULL)) THEN
      RAISE EXCEPTION 'Invalid claim in knowledge graph payload';
    END IF;

    object_key_value := CASE
      WHEN object_id_value IS NOT NULL THEN 'entity:' || object_id_value::text
      ELSE 'value:' || left(public.normalize_agent_graph_text(object_value_text), 230)
    END;
    fingerprint_value := encode(extensions.digest(
      subject_id_value::text || '|' || predicate_value || '|' || object_key_value,
      'sha256'
    ), 'hex');

    INSERT INTO public.agent_knowledge_claims (
      user_id, subject_entity_id, predicate, object_entity_id, object_value,
      object_key, statement, claim_fingerprint, confidence
    ) VALUES (
      source_chunk.user_id, subject_id_value, predicate_value, object_id_value, object_value_text,
      object_key_value, statement_value, fingerprint_value, confidence_value
    )
    ON CONFLICT ON CONSTRAINT agent_knowledge_claims_fingerprint_unique DO UPDATE
    SET updated_at = now(),
        confidence = greatest(public.agent_knowledge_claims.confidence, excluded.confidence),
        statement = CASE
          WHEN public.agent_knowledge_claims.evidence_status IN ('draft', 'unresolved') THEN excluded.statement
          ELSE public.agent_knowledge_claims.statement
        END
    RETURNING id, evidence_status INTO claim_id_value, claim_status_value;

    INSERT INTO public.agent_knowledge_claim_evidence (
      user_id, claim_id, source_chunk_id, evidence_role, excerpt
    ) VALUES (
      source_chunk.user_id, claim_id_value, source_chunk.id, 'supports', excerpt_value
    )
    ON CONFLICT ON CONSTRAINT agent_knowledge_claim_evidence_unique DO UPDATE
    SET excerpt = excluded.excerpt;

    IF object_id_value IS NOT NULL AND object_id_value <> subject_id_value THEN
      INSERT INTO public.agent_knowledge_relationships (
        user_id, from_entity_id, relation_type, to_entity_id, claim_id,
        evidence_status, confidence
      ) VALUES (
        source_chunk.user_id, subject_id_value, predicate_value, object_id_value, claim_id_value,
        claim_status_value, confidence_value
      )
      ON CONFLICT ON CONSTRAINT agent_knowledge_relationships_claim_unique DO UPDATE
      SET confidence = greatest(public.agent_knowledge_relationships.confidence, excluded.confidence),
          evidence_status = excluded.evidence_status,
          updated_at = now();
    END IF;

    IF public.is_agent_graph_single_valued_predicate(predicate_value) THEN
      FOR conflicting_claim IN
        SELECT claims.id
        FROM public.agent_knowledge_claims AS claims
        WHERE claims.user_id = source_chunk.user_id
          AND claims.subject_entity_id = subject_id_value
          AND claims.predicate = predicate_value
          AND claims.object_key <> object_key_value
          AND claims.evidence_status IN ('verified', 'draft', 'unresolved')
      LOOP
        left_id := least(claim_id_value, conflicting_claim.id);
        right_id := greatest(claim_id_value, conflicting_claim.id);
        INSERT INTO public.agent_knowledge_contradictions (
          user_id, left_claim_id, right_claim_id, reason
        ) VALUES (
          source_chunk.user_id,
          left_id,
          right_id,
          left('Different values were extracted for ' || replace(predicate_value, '_', ' ') || ' on the same subject.', 500)
        )
        ON CONFLICT ON CONSTRAINT agent_knowledge_contradictions_pair_unique DO NOTHING;
        GET DIAGNOSTICS inserted_contradictions = ROW_COUNT;
        contradiction_count := contradiction_count + inserted_contradictions;
      END LOOP;
    END IF;

    claim_count := claim_count + 1;
  END LOOP;

  UPDATE public.agent_knowledge_chunks
  SET graph_status = 'complete',
      graph_indexed_at = now(),
      graph_started_at = NULL,
      graph_next_retry_at = NULL,
      graph_error = NULL
  WHERE id = source_chunk.id;

  RETURN jsonb_build_object(
    'entities', entity_count,
    'claims', claim_count,
    'contradictions', contradiction_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_agent_knowledge_graph_jobs(
  p_chunk_ids UUID[],
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
  UPDATE public.agent_knowledge_chunks
  SET graph_status = 'failed',
      graph_started_at = NULL,
      graph_error = left(coalesce(nullif(trim(p_error), ''), 'Knowledge graph extraction failed'), 500),
      graph_next_retry_at = CASE
        WHEN graph_attempts >= 5 THEN NULL
        ELSE now() + make_interval(mins => least(60, greatest(1, graph_attempts * graph_attempts)))
      END
  WHERE id = ANY(coalesce(p_chunk_ids, ARRAY[]::uuid[]))
    AND graph_status = 'processing';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_agent_knowledge_claim(
  p_owner_id UUID,
  p_claim_id UUID,
  p_decision TEXT,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_claim public.agent_knowledge_claims%ROWTYPE;
  conflict_count INTEGER;
  decision_value TEXT := lower(trim(coalesce(p_decision, '')));
  resolution_value TEXT := nullif(left(trim(coalesce(p_resolution_note, '')), 1000), '');
BEGIN
  IF decision_value NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Unsupported claim review decision';
  END IF;

  SELECT * INTO selected_claim
  FROM public.agent_knowledge_claims
  WHERE id = p_claim_id AND user_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Knowledge claim not found';
  END IF;

  SELECT count(*)::integer INTO conflict_count
  FROM public.agent_knowledge_contradictions
  WHERE user_id = p_owner_id
    AND status = 'open'
    AND (left_claim_id = p_claim_id OR right_claim_id = p_claim_id);

  IF decision_value = 'approve' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.agent_knowledge_claim_evidence AS evidence
      JOIN public.agent_knowledge_chunks AS chunks
        ON chunks.id = evidence.source_chunk_id AND chunks.user_id = evidence.user_id
      WHERE evidence.claim_id = p_claim_id
        AND evidence.evidence_role = 'supports'
        AND chunks.is_active = true
        AND chunks.evidence_status = 'verified'
        AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
        AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
    ) THEN
      RAISE EXCEPTION 'Claim no longer has current verified evidence';
    END IF;

    IF conflict_count > 0 AND resolution_value IS NULL THEN
      RAISE EXCEPTION 'A resolution note is required when approving a contradictory claim';
    END IF;

    UPDATE public.agent_knowledge_claims
    SET evidence_status = 'superseded',
        reviewed_at = now(),
        review_note = resolution_value,
        updated_at = now()
    WHERE user_id = p_owner_id
      AND id IN (
        SELECT CASE
          WHEN left_claim_id = p_claim_id THEN right_claim_id
          ELSE left_claim_id
        END
        FROM public.agent_knowledge_contradictions
        WHERE user_id = p_owner_id
          AND status = 'open'
          AND (left_claim_id = p_claim_id OR right_claim_id = p_claim_id)
      );

    UPDATE public.agent_knowledge_relationships
    SET evidence_status = 'superseded', updated_at = now()
    WHERE user_id = p_owner_id
      AND claim_id IN (
        SELECT CASE
          WHEN left_claim_id = p_claim_id THEN right_claim_id
          ELSE left_claim_id
        END
        FROM public.agent_knowledge_contradictions
        WHERE user_id = p_owner_id
          AND status = 'open'
          AND (left_claim_id = p_claim_id OR right_claim_id = p_claim_id)
      );

    UPDATE public.agent_knowledge_contradictions
    SET status = 'resolved', resolution_note = resolution_value, resolved_at = now()
    WHERE user_id = p_owner_id
      AND status = 'open'
      AND (left_claim_id = p_claim_id OR right_claim_id = p_claim_id);

    UPDATE public.agent_knowledge_claims
    SET evidence_status = 'verified',
        verified_at = now(),
        reviewed_at = now(),
        review_note = resolution_value,
        updated_at = now()
    WHERE id = p_claim_id AND user_id = p_owner_id;

    UPDATE public.agent_knowledge_relationships
    SET evidence_status = 'verified', updated_at = now()
    WHERE claim_id = p_claim_id AND user_id = p_owner_id;

    UPDATE public.agent_knowledge_entities
    SET evidence_status = 'verified', updated_at = now()
    WHERE user_id = p_owner_id
      AND id IN (selected_claim.subject_entity_id, selected_claim.object_entity_id);

    UPDATE public.agent_knowledge_entity_aliases
    SET evidence_status = 'verified', updated_at = now()
    WHERE user_id = p_owner_id
      AND entity_id IN (selected_claim.subject_entity_id, selected_claim.object_entity_id)
      AND source_chunk_id IN (
        SELECT source_chunk_id
        FROM public.agent_knowledge_claim_evidence
        WHERE claim_id = p_claim_id AND evidence_role = 'supports'
      );
  ELSE
    UPDATE public.agent_knowledge_claims
    SET evidence_status = 'excluded',
        reviewed_at = now(),
        review_note = resolution_value,
        updated_at = now()
    WHERE id = p_claim_id AND user_id = p_owner_id;

    UPDATE public.agent_knowledge_relationships
    SET evidence_status = 'excluded', updated_at = now()
    WHERE claim_id = p_claim_id AND user_id = p_owner_id;

    UPDATE public.agent_knowledge_contradictions
    SET status = 'dismissed', resolution_note = resolution_value, resolved_at = now()
    WHERE user_id = p_owner_id
      AND status = 'open'
      AND (left_claim_id = p_claim_id OR right_claim_id = p_claim_id);
  END IF;

  RETURN jsonb_build_object(
    'claim_id', p_claim_id,
    'status', CASE WHEN decision_value = 'approve' THEN 'verified' ELSE 'excluded' END,
    'resolved_contradictions', conflict_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_agent_knowledge_graph(
  p_owner_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  claim_id UUID,
  subject_name TEXT,
  predicate TEXT,
  object_name TEXT,
  object_value TEXT,
  statement TEXT,
  supporting_source_titles TEXT[],
  supporting_source_urls TEXT[],
  supporting_source_ids UUID[],
  evidence_count INTEGER,
  graph_depth INTEGER,
  retrieval_rank REAL,
  verified_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH query_data AS (
    SELECT
      left(trim(coalesce(p_query, '')), 2000) AS query_text,
      public.normalize_agent_graph_text(left(trim(coalesce(p_query, '')), 2000)) AS normalized_query,
      websearch_to_tsquery('simple', left(trim(coalesce(p_query, '')), 2000)) AS query_terms
  ), direct_entities AS (
    SELECT entities.id, 0 AS graph_depth
    FROM public.agent_knowledge_entities AS entities
    CROSS JOIN query_data
    WHERE entities.user_id = p_owner_id
      AND entities.evidence_status = 'verified'
      AND (
        position(entities.normalized_name in query_data.normalized_query) > 0
        OR to_tsvector('simple', entities.canonical_name) @@ query_data.query_terms
        OR EXISTS (
          SELECT 1
          FROM public.agent_knowledge_entity_aliases AS aliases
          WHERE aliases.user_id = p_owner_id
            AND aliases.entity_id = entities.id
            AND aliases.evidence_status = 'verified'
            AND (
              position(aliases.normalized_alias in query_data.normalized_query) > 0
              OR to_tsvector('simple', aliases.alias) @@ query_data.query_terms
            )
        )
      )
  ), direct_claims AS (
    SELECT claims.id, 0 AS graph_depth, 1.0::real AS base_rank
    FROM public.agent_knowledge_claims AS claims
    CROSS JOIN query_data
    WHERE claims.user_id = p_owner_id
      AND claims.evidence_status = 'verified'
      AND to_tsvector('simple', claims.statement || ' ' || replace(claims.predicate, '_', ' ')) @@ query_data.query_terms
  ), first_hop_claims AS (
    SELECT claims.id, 1 AS graph_depth, 0.78::real AS base_rank
    FROM public.agent_knowledge_claims AS claims
    WHERE claims.user_id = p_owner_id
      AND claims.evidence_status = 'verified'
      AND (
        claims.subject_entity_id IN (SELECT id FROM direct_entities)
        OR claims.object_entity_id IN (SELECT id FROM direct_entities)
      )
  ), neighbor_entities AS (
    SELECT claims.subject_entity_id AS id
    FROM public.agent_knowledge_claims AS claims
    WHERE claims.id IN (SELECT id FROM first_hop_claims)
    UNION
    SELECT claims.object_entity_id
    FROM public.agent_knowledge_claims AS claims
    WHERE claims.id IN (SELECT id FROM first_hop_claims) AND claims.object_entity_id IS NOT NULL
  ), second_hop_claims AS (
    SELECT claims.id, 2 AS graph_depth, 0.48::real AS base_rank
    FROM public.agent_knowledge_claims AS claims
    WHERE claims.user_id = p_owner_id
      AND claims.evidence_status = 'verified'
      AND (
        claims.subject_entity_id IN (SELECT id FROM neighbor_entities)
        OR claims.object_entity_id IN (SELECT id FROM neighbor_entities)
      )
  ), candidates AS (
    SELECT id, min(graph_depth) AS graph_depth, max(base_rank) AS base_rank
    FROM (
      SELECT * FROM direct_claims
      UNION ALL
      SELECT * FROM first_hop_claims
      UNION ALL
      SELECT * FROM second_hop_claims
    ) ranked
    GROUP BY id
  ), eligible AS (
    SELECT
      claims.id,
      subjects.canonical_name AS subject_name,
      claims.predicate,
      objects.canonical_name AS object_name,
      claims.object_value,
      claims.statement,
      candidates.graph_depth,
      candidates.base_rank,
      claims.confidence,
      claims.verified_at
    FROM candidates
    JOIN public.agent_knowledge_claims AS claims ON claims.id = candidates.id
    JOIN public.agent_knowledge_entities AS subjects ON subjects.id = claims.subject_entity_id
    LEFT JOIN public.agent_knowledge_entities AS objects ON objects.id = claims.object_entity_id
    WHERE (claims.valid_from IS NULL OR claims.valid_from <= now())
      AND (claims.valid_until IS NULL OR claims.valid_until > now())
      AND NOT EXISTS (
        SELECT 1 FROM public.agent_knowledge_contradictions AS contradictions
        WHERE contradictions.user_id = p_owner_id
          AND contradictions.status = 'open'
          AND (contradictions.left_claim_id = claims.id OR contradictions.right_claim_id = claims.id)
      )
  )
  SELECT
    eligible.id,
    eligible.subject_name,
    eligible.predicate,
    eligible.object_name,
    eligible.object_value,
    eligible.statement,
    array_agg(DISTINCT chunks.source_title ORDER BY chunks.source_title),
    array_remove(array_agg(DISTINCT chunks.source_url ORDER BY chunks.source_url), NULL),
    array_agg(DISTINCT coalesce(chunks.knowledge_id, chunks.document_id)),
    count(DISTINCT evidence.source_chunk_id)::integer,
    eligible.graph_depth,
    (eligible.base_rank + least(count(DISTINCT evidence.source_chunk_id)::real, 5) * 0.04 + eligible.confidence * 0.08)::real,
    eligible.verified_at
  FROM eligible
  JOIN public.agent_knowledge_claim_evidence AS evidence
    ON evidence.claim_id = eligible.id AND evidence.evidence_role = 'supports'
  JOIN public.agent_knowledge_chunks AS chunks
    ON chunks.id = evidence.source_chunk_id
    AND chunks.user_id = p_owner_id
    AND chunks.is_active = true
    AND chunks.evidence_status = 'verified'
    AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
    AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
  GROUP BY
    eligible.id, eligible.subject_name, eligible.predicate, eligible.object_name,
    eligible.object_value, eligible.statement, eligible.graph_depth,
    eligible.base_rank, eligible.confidence, eligible.verified_at
  ORDER BY 12 DESC, eligible.verified_at DESC NULLS LAST, eligible.id
  LIMIT greatest(1, least(coalesce(p_limit, 12), 24));
$$;

CREATE OR REPLACE FUNCTION public.mark_orphaned_agent_knowledge_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.agent_knowledge_claim_evidence
    WHERE claim_id = OLD.claim_id AND evidence_role = 'supports'
  ) THEN
    UPDATE public.agent_knowledge_claims
    SET evidence_status = CASE
          WHEN evidence_status IN ('verified', 'draft') THEN 'unresolved'
          ELSE evidence_status
        END,
        updated_at = now()
    WHERE id = OLD.claim_id;

    UPDATE public.agent_knowledge_relationships
    SET evidence_status = CASE
          WHEN evidence_status IN ('verified', 'draft') THEN 'unresolved'
          ELSE evidence_status
        END,
        updated_at = now()
    WHERE claim_id = OLD.claim_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS mark_orphaned_agent_knowledge_claim_trigger
ON public.agent_knowledge_claim_evidence;
CREATE TRIGGER mark_orphaned_agent_knowledge_claim_trigger
AFTER DELETE ON public.agent_knowledge_claim_evidence
FOR EACH ROW EXECUTE FUNCTION public.mark_orphaned_agent_knowledge_claim();

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agent_knowledge_entities',
    'agent_knowledge_entity_aliases',
    'agent_knowledge_claims',
    'agent_knowledge_claim_evidence',
    'agent_knowledge_relationships',
    'agent_knowledge_contradictions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Owners read their own graph data" ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY "Owners read their own graph data" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)',
      table_name
    );
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_agent_graph_text(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_agent_graph_single_valued_predicate(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_agent_knowledge_graph_jobs(INTEGER, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.store_agent_knowledge_graph_extraction(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_agent_knowledge_graph_jobs(UUID[], TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_agent_knowledge_claim(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_agent_knowledge_graph(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_orphaned_agent_knowledge_claim() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_agent_knowledge_graph_jobs(INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_agent_knowledge_graph_extraction(UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_agent_knowledge_graph_jobs(UUID[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_agent_knowledge_claim(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_agent_knowledge_graph(UUID, TEXT, INTEGER) TO service_role;

COMMENT ON TABLE public.agent_knowledge_entities IS
  'Tenant-scoped canonical entities extracted from approved source chunks; model output remains draft until owner review.';
COMMENT ON TABLE public.agent_knowledge_claims IS
  'Atomic source-backed claims. Only verified, current, non-contradictory claims may enter chat retrieval.';
COMMENT ON TABLE public.agent_knowledge_contradictions IS
  'Explicit conflicts between claims sharing a subject and predicate but asserting different objects.';
COMMENT ON FUNCTION public.search_agent_knowledge_graph(UUID, TEXT, INTEGER) IS
  'Service-only, tenant-scoped traversal returning verified claims up to two entity hops from the query.';
