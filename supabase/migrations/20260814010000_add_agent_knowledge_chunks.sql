-- Phase 1 knowledge fabric: preserve owner-approved source records while
-- maintaining a smaller, source-aware retrieval index automatically.

ALTER TABLE public.agent_knowledge
  ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.agent_knowledge
  DROP CONSTRAINT IF EXISTS agent_knowledge_evidence_status_check,
  ADD CONSTRAINT agent_knowledge_evidence_status_check
    CHECK (evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')),
  DROP CONSTRAINT IF EXISTS agent_knowledge_validity_check,
  ADD CONSTRAINT agent_knowledge_validity_check
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  DROP CONSTRAINT IF EXISTS agent_knowledge_source_version_check,
  ADD CONSTRAINT agent_knowledge_source_version_check CHECK (source_version > 0);

ALTER TABLE public.agent_documents
  ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.agent_documents
  DROP CONSTRAINT IF EXISTS agent_documents_evidence_status_check,
  ADD CONSTRAINT agent_documents_evidence_status_check
    CHECK (evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')),
  DROP CONSTRAINT IF EXISTS agent_documents_validity_check,
  ADD CONSTRAINT agent_documents_validity_check
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  DROP CONSTRAINT IF EXISTS agent_documents_source_version_check,
  ADD CONSTRAINT agent_documents_source_version_check CHECK (source_version > 0);

CREATE TABLE IF NOT EXISTS public.agent_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_id UUID REFERENCES public.agent_knowledge(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.agent_documents(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_title TEXT NOT NULL,
  source_url TEXT,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'verified',
  verified_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  source_version INTEGER NOT NULL DEFAULT 1,
  source_updated_at TIMESTAMPTZ NOT NULL,
  content_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(source_title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_chunks_one_parent_check CHECK (
    (knowledge_id IS NOT NULL AND document_id IS NULL)
    OR (knowledge_id IS NULL AND document_id IS NOT NULL)
  ),
  CONSTRAINT agent_knowledge_chunks_content_check CHECK (char_length(content) BETWEEN 1 AND 4000),
  CONSTRAINT agent_knowledge_chunks_positions_check CHECK (
    chunk_index >= 0 AND char_start >= 0 AND char_end > char_start
  ),
  CONSTRAINT agent_knowledge_chunks_priority_check CHECK (priority BETWEEN 1 AND 5),
  CONSTRAINT agent_knowledge_chunks_evidence_status_check CHECK (
    evidence_status IN ('verified', 'draft', 'unresolved', 'excluded')
  ),
  CONSTRAINT agent_knowledge_chunks_validity_check CHECK (
    valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from
  ),
  CONSTRAINT agent_knowledge_chunks_source_version_check CHECK (source_version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_knowledge_chunks_knowledge_position_idx
ON public.agent_knowledge_chunks (knowledge_id, chunk_index)
WHERE knowledge_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agent_knowledge_chunks_document_position_idx
ON public.agent_knowledge_chunks (document_id, chunk_index)
WHERE document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_knowledge_chunks_owner_active_idx
ON public.agent_knowledge_chunks (user_id, is_active, priority DESC, source_updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_knowledge_chunks_search_idx
ON public.agent_knowledge_chunks USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.split_agent_knowledge_text(
  p_content TEXT,
  p_chunk_size INTEGER DEFAULT 1600,
  p_overlap INTEGER DEFAULT 180
)
RETURNS TABLE (
  chunk_index INTEGER,
  chunk_content TEXT,
  char_start INTEGER,
  char_end INTEGER
)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_content TEXT;
  total_length INTEGER;
  chunk_size INTEGER;
  overlap_size INTEGER;
  start_position INTEGER := 1;
  proposed_length INTEGER;
  boundary_offset INTEGER;
  candidate TEXT;
BEGIN
  normalized_content := btrim(regexp_replace(coalesce(p_content, ''), E'\\r\\n?', E'\\n', 'g'));
  total_length := char_length(normalized_content);
  IF total_length = 0 THEN
    RETURN;
  END IF;

  chunk_size := greatest(400, least(coalesce(p_chunk_size, 1600), 4000));
  overlap_size := greatest(0, least(coalesce(p_overlap, 180), chunk_size / 3));
  chunk_index := 0;

  WHILE start_position <= total_length LOOP
    proposed_length := least(chunk_size, total_length - start_position + 1);
    candidate := substring(normalized_content FROM start_position FOR proposed_length);
    boundary_offset := proposed_length;

    IF start_position + proposed_length - 1 < total_length THEN
      boundary_offset := char_length(candidate) - strpos(reverse(candidate), ' ') + 1;
      IF boundary_offset < floor(chunk_size * 0.6)::INTEGER OR boundary_offset > proposed_length THEN
        boundary_offset := proposed_length;
      END IF;
    END IF;

    chunk_content := btrim(substring(normalized_content FROM start_position FOR boundary_offset));
    char_start := start_position - 1;
    char_end := char_start + boundary_offset;
    IF chunk_content <> '' THEN
      RETURN NEXT;
      chunk_index := chunk_index + 1;
    END IF;

    EXIT WHEN start_position + boundary_offset - 1 >= total_length;
    start_position := greatest(start_position + 1, start_position + boundary_offset - overlap_size);
  END LOOP;
END;
$$;

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

DROP TRIGGER IF EXISTS sync_agent_knowledge_chunks_fact_trigger ON public.agent_knowledge;
CREATE TRIGGER sync_agent_knowledge_chunks_fact_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.agent_knowledge
FOR EACH ROW EXECUTE FUNCTION public.sync_agent_knowledge_chunks_from_fact();

DROP TRIGGER IF EXISTS sync_agent_knowledge_chunks_document_trigger ON public.agent_documents;
CREATE TRIGGER sync_agent_knowledge_chunks_document_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.agent_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_agent_knowledge_chunks_from_document();

-- Backfill every existing approved source so owners do not need to re-upload it.
INSERT INTO public.agent_knowledge_chunks (
  user_id, knowledge_id, source_type, source_title, source_url, content,
  chunk_index, char_start, char_end, priority, category, evidence_status,
  verified_at, valid_from, valid_until, source_version, source_updated_at,
  content_hash, is_active
)
SELECT
  knowledge.user_id,
  knowledge.id,
  coalesce(knowledge.source_type, 'text'),
  knowledge.title,
  knowledge.source_url,
  split.chunk_content,
  split.chunk_index,
  split.char_start,
  split.char_end,
  greatest(1, least(coalesce(knowledge.priority, 1), 5)),
  knowledge.category,
  knowledge.evidence_status,
  knowledge.verified_at,
  knowledge.valid_from,
  knowledge.valid_until,
  knowledge.source_version,
  coalesce(knowledge.updated_at, knowledge.created_at, now()),
  encode(extensions.digest(split.chunk_content, 'sha256'), 'hex'),
  coalesce(knowledge.is_active, true) AND knowledge.evidence_status = 'verified'
FROM public.agent_knowledge AS knowledge
CROSS JOIN LATERAL public.split_agent_knowledge_text(knowledge.content) AS split
ON CONFLICT DO NOTHING;

INSERT INTO public.agent_knowledge_chunks (
  user_id, document_id, source_type, source_title, content, chunk_index,
  char_start, char_end, priority, category, evidence_status, verified_at,
  valid_from, valid_until, source_version, source_updated_at, content_hash,
  is_active
)
SELECT
  document.user_id,
  document.id,
  'file',
  document.filename,
  split.chunk_content,
  split.chunk_index,
  split.char_start,
  split.char_end,
  1,
  'document',
  document.evidence_status,
  document.verified_at,
  document.valid_from,
  document.valid_until,
  document.source_version,
  coalesce(document.updated_at, document.created_at, now()),
  encode(extensions.digest(split.chunk_content, 'sha256'), 'hex'),
  coalesce(document.is_processed, false)
    AND coalesce(document.processing_status, 'pending') = 'complete'
    AND document.evidence_status = 'verified'
FROM public.agent_documents AS document
CROSS JOIN LATERAL public.split_agent_knowledge_text(document.extracted_text) AS split
WHERE document.extracted_text IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.search_agent_knowledge_chunks(
  p_owner_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 80
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  query_text TEXT := left(btrim(coalesce(p_query, '')), 2000);
  query_limit INTEGER := greatest(1, least(coalesce(p_limit, 80), 100));
  parsed_query TSQUERY;
BEGIN
  IF p_owner_id IS NULL THEN
    RETURN;
  END IF;

  IF query_text = '' THEN
    RETURN QUERY
    SELECT
      chunks.id,
      chunks.knowledge_id,
      chunks.document_id,
      chunks.source_type,
      chunks.source_title,
      chunks.source_url,
      chunks.content,
      chunks.chunk_index,
      chunks.priority,
      chunks.category,
      chunks.evidence_status,
      chunks.verified_at,
      chunks.valid_from,
      chunks.valid_until,
      ((chunks.priority - 1) * 0.05)::REAL
    FROM public.agent_knowledge_chunks AS chunks
    WHERE chunks.user_id = p_owner_id
      AND chunks.is_active
      AND chunks.evidence_status = 'verified'
      AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
      AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
    ORDER BY chunks.priority DESC, chunks.source_updated_at DESC, chunks.chunk_index
    LIMIT query_limit;
    RETURN;
  END IF;

  parsed_query := websearch_to_tsquery('simple', query_text);
  IF numnode(parsed_query) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    chunks.id,
    chunks.knowledge_id,
    chunks.document_id,
    chunks.source_type,
    chunks.source_title,
    chunks.source_url,
    chunks.content,
    chunks.chunk_index,
    chunks.priority,
    chunks.category,
    chunks.evidence_status,
    chunks.verified_at,
    chunks.valid_from,
    chunks.valid_until,
    (
      ts_rank_cd(chunks.search_vector, parsed_query, 32) * 20
      + (chunks.priority - 1) * 0.05
    )::REAL
  FROM public.agent_knowledge_chunks AS chunks
  WHERE chunks.user_id = p_owner_id
    AND chunks.is_active
    AND chunks.evidence_status = 'verified'
    AND (chunks.valid_from IS NULL OR chunks.valid_from <= now())
    AND (chunks.valid_until IS NULL OR chunks.valid_until > now())
    AND chunks.search_vector @@ parsed_query
  ORDER BY
    ts_rank_cd(chunks.search_vector, parsed_query, 32) DESC,
    chunks.priority DESC,
    chunks.source_updated_at DESC,
    chunks.chunk_index
  LIMIT query_limit;
END;
$$;

ALTER TABLE public.agent_knowledge_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their own knowledge chunks" ON public.agent_knowledge_chunks;
CREATE POLICY "Owners read their own knowledge chunks"
ON public.agent_knowledge_chunks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.agent_knowledge_chunks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.agent_knowledge_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_knowledge_chunks TO service_role;

REVOKE ALL ON FUNCTION public.split_agent_knowledge_text(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_agent_knowledge_chunks_from_fact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_agent_knowledge_chunks_from_document() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_agent_knowledge_chunks(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_agent_knowledge_chunks(UUID, TEXT, INTEGER) TO service_role;

COMMENT ON TABLE public.agent_knowledge_chunks IS
'Derived, source-aware retrieval chunks. Owner-approved facts and documents remain authoritative.';
COMMENT ON COLUMN public.agent_knowledge_chunks.evidence_status IS
'Only verified, active, currently valid chunks may be retrieved by the public agent.';
COMMENT ON FUNCTION public.search_agent_knowledge_chunks(UUID, TEXT, INTEGER) IS
'Service-only, tenant-scoped lexical retrieval for approved knowledge chunks.';
