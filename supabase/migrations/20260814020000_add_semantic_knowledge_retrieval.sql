-- Phase 2 knowledge fabric: optional semantic embeddings and hybrid retrieval.
-- Lexical retrieval remains available when the embedding worker is disabled.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO service_role;

ALTER TABLE public.agent_knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(384),
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS embedding_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_error TEXT;

ALTER TABLE public.agent_knowledge_chunks
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_embedding_status_check,
  ADD CONSTRAINT agent_knowledge_chunks_embedding_status_check
    CHECK (embedding_status IN ('pending', 'processing', 'complete', 'failed')),
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_embedding_attempts_check,
  ADD CONSTRAINT agent_knowledge_chunks_embedding_attempts_check
    CHECK (embedding_attempts BETWEEN 0 AND 10),
  DROP CONSTRAINT IF EXISTS agent_knowledge_chunks_embedding_state_check,
  ADD CONSTRAINT agent_knowledge_chunks_embedding_state_check CHECK (
    (embedding_status = 'complete'
      AND embedding IS NOT NULL
      AND embedding_model IS NOT NULL
      AND embedded_at IS NOT NULL)
    OR embedding_status <> 'complete'
  );

CREATE INDEX IF NOT EXISTS agent_knowledge_chunks_embedding_hnsw_idx
ON public.agent_knowledge_chunks
USING hnsw (embedding extensions.vector_cosine_ops)
WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_knowledge_chunks_embedding_queue_idx
ON public.agent_knowledge_chunks (
  embedding_status,
  embedding_next_retry_at,
  embedding_attempts,
  source_updated_at
)
WHERE is_active AND embedding_status <> 'complete';

-- Metadata-only edits (for example FAQ priority or validity) should not erase a
-- valid embedding. Content or title changes still recreate and requeue chunks.
CREATE OR REPLACE FUNCTION public.sync_agent_knowledge_chunks_from_fact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.agent_knowledge_chunks WHERE knowledge_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.content IS NOT DISTINCT FROM OLD.content
    AND NEW.title IS NOT DISTINCT FROM OLD.title THEN
    UPDATE public.agent_knowledge_chunks
    SET user_id = NEW.user_id,
        source_type = coalesce(NEW.source_type, 'text'),
        source_url = NEW.source_url,
        priority = greatest(1, least(coalesce(NEW.priority, 1), 5)),
        category = NEW.category,
        evidence_status = NEW.evidence_status,
        verified_at = NEW.verified_at,
        valid_from = NEW.valid_from,
        valid_until = NEW.valid_until,
        source_version = NEW.source_version,
        source_updated_at = coalesce(NEW.updated_at, NEW.created_at, now()),
        is_active = coalesce(NEW.is_active, true) AND NEW.evidence_status = 'verified',
        updated_at = now()
    WHERE knowledge_id = NEW.id;
    RETURN NEW;
  END IF;

  DELETE FROM public.agent_knowledge_chunks WHERE knowledge_id = NEW.id;
  IF NEW.content IS NULL OR btrim(NEW.content) = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.agent_knowledge_chunks (
    user_id, knowledge_id, source_type, source_title, source_url, content,
    chunk_index, char_start, char_end, priority, category, evidence_status,
    verified_at, valid_from, valid_until, source_version, source_updated_at,
    content_hash, is_active
  )
  SELECT
    NEW.user_id,
    NEW.id,
    coalesce(NEW.source_type, 'text'),
    NEW.title,
    NEW.source_url,
    split.chunk_content,
    split.chunk_index,
    split.char_start,
    split.char_end,
    greatest(1, least(coalesce(NEW.priority, 1), 5)),
    NEW.category,
    NEW.evidence_status,
    NEW.verified_at,
    NEW.valid_from,
    NEW.valid_until,
    NEW.source_version,
    coalesce(NEW.updated_at, NEW.created_at, now()),
    encode(extensions.digest(split.chunk_content, 'sha256'), 'hex'),
    coalesce(NEW.is_active, true) AND NEW.evidence_status = 'verified'
  FROM public.split_agent_knowledge_text(NEW.content) AS split;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_agent_knowledge_chunks_from_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.agent_knowledge_chunks WHERE document_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.extracted_text IS NOT DISTINCT FROM OLD.extracted_text
    AND NEW.filename IS NOT DISTINCT FROM OLD.filename THEN
    UPDATE public.agent_knowledge_chunks
    SET user_id = NEW.user_id,
        evidence_status = NEW.evidence_status,
        verified_at = NEW.verified_at,
        valid_from = NEW.valid_from,
        valid_until = NEW.valid_until,
        source_version = NEW.source_version,
        source_updated_at = coalesce(NEW.updated_at, NEW.created_at, now()),
        is_active = coalesce(NEW.is_processed, false)
          AND coalesce(NEW.processing_status, 'pending') = 'complete'
          AND NEW.evidence_status = 'verified',
        updated_at = now()
    WHERE document_id = NEW.id;
    RETURN NEW;
  END IF;

  DELETE FROM public.agent_knowledge_chunks WHERE document_id = NEW.id;
  IF NEW.extracted_text IS NULL OR btrim(NEW.extracted_text) = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.agent_knowledge_chunks (
    user_id, document_id, source_type, source_title, content, chunk_index,
    char_start, char_end, priority, category, evidence_status, verified_at,
    valid_from, valid_until, source_version, source_updated_at, content_hash,
    is_active
  )
  SELECT
    NEW.user_id,
    NEW.id,
    'file',
    NEW.filename,
    split.chunk_content,
    split.chunk_index,
    split.char_start,
    split.char_end,
    1,
    'document',
    NEW.evidence_status,
    NEW.verified_at,
    NEW.valid_from,
    NEW.valid_until,
    NEW.source_version,
    coalesce(NEW.updated_at, NEW.created_at, now()),
    encode(extensions.digest(split.chunk_content, 'sha256'), 'hex'),
    coalesce(NEW.is_processed, false)
      AND coalesce(NEW.processing_status, 'pending') = 'complete'
      AND NEW.evidence_status = 'verified'
  FROM public.split_agent_knowledge_text(NEW.extracted_text) AS split;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_agent_knowledge_embedding_jobs(
  p_limit INTEGER DEFAULT 12,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  user_id UUID,
  source_title TEXT,
  content TEXT,
  content_hash TEXT,
  embedding_attempt INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  claim_limit INTEGER := greatest(1, least(coalesce(p_limit, 12), 32));
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT chunks.id
    FROM public.agent_knowledge_chunks AS chunks
    WHERE chunks.is_active
      AND chunks.evidence_status = 'verified'
      AND (p_owner_id IS NULL OR chunks.user_id = p_owner_id)
      AND chunks.embedding_attempts < 5
      AND (
        chunks.embedding_status = 'pending'
        OR (
          chunks.embedding_status = 'failed'
          AND coalesce(chunks.embedding_next_retry_at, '-infinity'::timestamptz) <= now()
        )
        OR (
          chunks.embedding_status = 'processing'
          AND chunks.embedding_started_at < now() - interval '15 minutes'
        )
      )
    ORDER BY chunks.source_updated_at, chunks.chunk_index
    FOR UPDATE SKIP LOCKED
    LIMIT claim_limit
  ), updated AS (
    UPDATE public.agent_knowledge_chunks AS chunks
    SET embedding_status = 'processing',
        embedding_attempts = chunks.embedding_attempts + 1,
        embedding_started_at = now(),
        embedding_next_retry_at = NULL,
        embedding_error = NULL,
        updated_at = now()
    FROM claimable
    WHERE chunks.id = claimable.id
    RETURNING chunks.*
  )
  SELECT
    updated.id,
    updated.user_id,
    updated.source_title,
    updated.content,
    updated.content_hash,
    updated.embedding_attempts
  FROM updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_agent_knowledge_chunk_embeddings(
  p_model TEXT,
  p_embeddings JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  stored_count INTEGER := 0;
  item_count INTEGER := 0;
  embedding_item JSONB;
  embedding_values REAL[];
BEGIN
  IF p_model <> 'gte-small@1' OR jsonb_typeof(p_embeddings) <> 'array' THEN
    RAISE EXCEPTION 'Invalid embedding payload';
  END IF;

  FOR embedding_item IN SELECT value FROM jsonb_array_elements(p_embeddings)
  LOOP
    IF jsonb_typeof(embedding_item->'embedding') <> 'array'
      OR jsonb_array_length(embedding_item->'embedding') <> 384
      OR coalesce(embedding_item->>'content_hash', '') = '' THEN
      RAISE EXCEPTION 'Invalid embedding item';
    END IF;

    SELECT array_agg(value::REAL ORDER BY ordinal)
    INTO embedding_values
    FROM jsonb_array_elements_text(embedding_item->'embedding') WITH ORDINALITY AS values(value, ordinal);

    UPDATE public.agent_knowledge_chunks
    SET embedding = embedding_values::extensions.vector(384),
        embedding_model = p_model,
        embedding_status = 'complete',
        embedded_at = now(),
        embedding_started_at = NULL,
        embedding_next_retry_at = NULL,
        embedding_error = NULL,
        updated_at = now()
    WHERE id = (embedding_item->>'id')::UUID
      AND content_hash = embedding_item->>'content_hash'
      AND embedding_status = 'processing';

    GET DIAGNOSTICS item_count = ROW_COUNT;
    stored_count := stored_count + item_count;
  END LOOP;

  RETURN stored_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_agent_knowledge_embedding_jobs(
  p_chunk_ids UUID[],
  p_error TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  failed_count INTEGER;
BEGIN
  UPDATE public.agent_knowledge_chunks
  SET embedding_status = 'failed',
      embedding_started_at = NULL,
      embedding_next_retry_at = now() + make_interval(mins => least(60, greatest(1, embedding_attempts * 5))),
      embedding_error = left(coalesce(nullif(btrim(p_error), ''), 'Embedding generation failed'), 500),
      updated_at = now()
  WHERE id = ANY(coalesce(p_chunk_ids, ARRAY[]::UUID[]))
    AND embedding_status = 'processing';

  GET DIAGNOSTICS failed_count = ROW_COUNT;
  RETURN failed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.hybrid_search_agent_knowledge_chunks(
  p_owner_id UUID,
  p_query TEXT,
  p_query_embedding extensions.vector(384),
  p_limit INTEGER DEFAULT 80,
  p_model TEXT DEFAULT 'gte-small@1',
  p_match_threshold REAL DEFAULT 0.45
)
RETURNS TABLE (
  chunk_id UUID,
  knowledge_id UUID,
  document_id UUID,
  source_type TEXT,
  source_title TEXT,
  source_url TEXT,
  content TEXT,
  chunk_index INTEGER,
  priority INTEGER,
  category TEXT,
  evidence_status TEXT,
  verified_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  retrieval_rank REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  WITH settings AS (
    SELECT
      greatest(1, least(coalesce(p_limit, 80), 100)) AS result_limit,
      websearch_to_tsquery('simple', left(btrim(coalesce(p_query, '')), 2000)) AS parsed_query
  ), eligible AS (
    SELECT chunks.*
    FROM public.agent_knowledge_chunks AS chunks
    WHERE chunks.user_id = p_owner_id
      AND chunks.is_active
      AND chunks.evidence_status = 'verified'
      AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
      AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
  ), lexical AS (
    SELECT
      eligible.id,
      row_number() OVER (
        ORDER BY ts_rank_cd(eligible.search_vector, settings.parsed_query, 32) DESC,
                 eligible.priority DESC,
                 eligible.source_updated_at DESC
      ) AS rank
    FROM eligible
    CROSS JOIN settings
    WHERE numnode(settings.parsed_query) > 0
      AND eligible.search_vector @@ settings.parsed_query
    LIMIT 100
  ), semantic_scored AS (
    SELECT
      eligible.*,
      (1 - (eligible.embedding <=> p_query_embedding)) AS similarity
    FROM eligible
    WHERE p_query_embedding IS NOT NULL
      AND eligible.embedding_status = 'complete'
      AND eligible.embedding_model = p_model
      AND eligible.embedding IS NOT NULL
  ), semantic AS (
    SELECT
      semantic_scored.id,
      row_number() OVER (
        ORDER BY semantic_scored.similarity DESC,
                 semantic_scored.priority DESC,
                 semantic_scored.source_updated_at DESC
      ) AS rank
    FROM semantic_scored
    WHERE semantic_scored.similarity >= greatest(0, least(coalesce(p_match_threshold, 0.45), 1))
    ORDER BY semantic_scored.similarity DESC
    LIMIT 100
  ), combined AS (
    SELECT
      coalesce(lexical.id, semantic.id) AS id,
      (
        coalesce(1.0 / (60 + lexical.rank), 0.0) * 0.45
        + coalesce(1.0 / (60 + semantic.rank), 0.0) * 0.55
      ) AS reciprocal_rank
    FROM lexical
    FULL OUTER JOIN semantic ON semantic.id = lexical.id
  )
  SELECT
    eligible.id,
    eligible.knowledge_id,
    eligible.document_id,
    eligible.source_type,
    eligible.source_title,
    eligible.source_url,
    eligible.content,
    eligible.chunk_index,
    eligible.priority,
    eligible.category,
    eligible.evidence_status,
    eligible.verified_at,
    eligible.valid_from,
    eligible.valid_until,
    (combined.reciprocal_rank * 1000)::REAL
  FROM combined
  JOIN eligible ON eligible.id = combined.id
  CROSS JOIN settings
  ORDER BY combined.reciprocal_rank DESC,
           eligible.priority DESC,
           eligible.source_updated_at DESC
  LIMIT (SELECT result_limit FROM settings);
$$;

REVOKE ALL ON FUNCTION public.claim_agent_knowledge_embedding_jobs(INTEGER, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.store_agent_knowledge_chunk_embeddings(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_agent_knowledge_embedding_jobs(UUID[], TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hybrid_search_agent_knowledge_chunks(UUID, TEXT, extensions.vector, INTEGER, TEXT, REAL) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_agent_knowledge_embedding_jobs(INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_agent_knowledge_chunk_embeddings(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_agent_knowledge_embedding_jobs(UUID[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.hybrid_search_agent_knowledge_chunks(UUID, TEXT, extensions.vector, INTEGER, TEXT, REAL) TO service_role;

COMMENT ON COLUMN public.agent_knowledge_chunks.embedding IS
'Normalized 384-dimensional gte-small embedding for optional semantic retrieval.';
COMMENT ON FUNCTION public.hybrid_search_agent_knowledge_chunks(UUID, TEXT, extensions.vector, INTEGER, TEXT, REAL) IS
'Service-only tenant-scoped reciprocal-rank fusion of lexical and semantic chunk matches.';
