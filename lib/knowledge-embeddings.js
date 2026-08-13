import 'server-only';

export const KNOWLEDGE_EMBEDDING_MODEL = 'gte-small@1';
export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 384;
const MAX_EDGE_INPUTS = 16;

export function isKnowledgeEmbeddingsEnabled() {
  return process.env.KNOWLEDGE_EMBEDDINGS_ENABLED === '1';
}

function embeddingEndpoint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Supabase URL is not configured');
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/knowledge-embeddings`;
}

function validateEmbedding(value) {
  return Array.isArray(value)
    && value.length === KNOWLEDGE_EMBEDDING_DIMENSIONS
    && value.every((entry) => Number.isFinite(entry));
}

export async function generateKnowledgeEmbeddings(inputs, options = {}) {
  const normalizedInputs = (Array.isArray(inputs) ? inputs : [])
    .map((value) => String(value || '').trim().slice(0, 4_000));
  if (!normalizedInputs.length || normalizedInputs.length > MAX_EDGE_INPUTS || normalizedInputs.some((value) => !value)) {
    throw new Error(`Embedding input count must be between 1 and ${MAX_EDGE_INPUTS}`);
  }

  const embeddingSecret = process.env.KNOWLEDGE_EMBEDDINGS_SECRET;
  if (!embeddingSecret) throw new Error('Embedding service authentication is not configured');

  const response = await fetch(embeddingEndpoint(), {
    method: 'POST',
    headers: {
      apikey: embeddingSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: normalizedInputs }),
    cache: 'no-store',
    signal: AbortSignal.timeout(options.timeoutMs || 10_000),
  });

  if (!response.ok) {
    throw new Error(`Embedding service returned ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.model !== KNOWLEDGE_EMBEDDING_MODEL
      || payload?.dimensions !== KNOWLEDGE_EMBEDDING_DIMENSIONS
      || !Array.isArray(payload?.embeddings)
      || payload.embeddings.length !== normalizedInputs.length
      || payload.embeddings.some((embedding) => !validateEmbedding(embedding))) {
    throw new Error('Embedding service returned an invalid payload');
  }

  return payload.embeddings;
}

async function failClaimedJobs(supabase, jobs, error) {
  if (!jobs.length) return;
  const safeMessage = error instanceof Error ? error.message : 'Embedding generation failed';
  const { error: failureError } = await supabase.rpc('fail_agent_knowledge_embedding_jobs', {
    p_chunk_ids: jobs.map((job) => job.chunk_id),
    p_error: safeMessage.slice(0, 500),
  });
  if (failureError) console.warn('Unable to record failed knowledge embedding jobs:', failureError.message);
}

async function claimEmbeddingJobs(supabase, { ownerId = null, limit = 12 } = {}) {
  const { data, error } = await supabase.rpc('claim_agent_knowledge_embedding_jobs', {
    p_limit: Math.max(1, Math.min(limit, MAX_EDGE_INPUTS)),
    p_owner_id: ownerId,
  });
  if (error) throw error;
  return data || [];
}

async function storeEmbeddings(supabase, jobs, embeddings) {
  if (!jobs.length) return 0;
  const { data, error } = await supabase.rpc('store_agent_knowledge_chunk_embeddings', {
    p_model: KNOWLEDGE_EMBEDDING_MODEL,
    p_embeddings: jobs.map((job, index) => ({
      id: job.chunk_id,
      content_hash: job.content_hash,
      embedding: embeddings[index],
    })),
  });
  if (error) throw error;
  return Number(data) || 0;
}

export async function processPendingKnowledgeEmbeddings({ supabase, ownerId = null, limit = 12 } = {}) {
  if (!isKnowledgeEmbeddingsEnabled()) {
    return { enabled: false, claimed: 0, stored: 0 };
  }

  const jobs = await claimEmbeddingJobs(supabase, { ownerId, limit });
  if (!jobs.length) return { enabled: true, claimed: 0, stored: 0 };

  try {
    const embeddings = await generateKnowledgeEmbeddings(
      jobs.map((job) => `${job.source_title}\n\n${job.content}`),
    );
    const stored = await storeEmbeddings(supabase, jobs, embeddings);
    return { enabled: true, claimed: jobs.length, stored };
  } catch (error) {
    await failClaimedJobs(supabase, jobs, error);
    throw error;
  }
}

export async function searchHybridKnowledge({ supabase, ownerId, query, indexLimit = 6 } = {}) {
  const normalizedQuery = String(query || '').trim().slice(0, 2_000);
  if (!isKnowledgeEmbeddingsEnabled() || !normalizedQuery) {
    return { knowledge: null, error: null };
  }

  let jobs = [];
  try {
    jobs = await claimEmbeddingJobs(supabase, { ownerId, limit: Math.min(indexLimit, MAX_EDGE_INPUTS - 1) });
    const inputs = [normalizedQuery, ...jobs.map((job) => `${job.source_title}\n\n${job.content}`)];
    const embeddings = await generateKnowledgeEmbeddings(inputs);

    if (jobs.length) {
      await storeEmbeddings(supabase, jobs, embeddings.slice(1));
    }

    const { data, error } = await supabase.rpc('hybrid_search_agent_knowledge_chunks', {
      p_owner_id: ownerId,
      p_query: normalizedQuery,
      p_query_embedding: embeddings[0],
      p_limit: 80,
      p_model: KNOWLEDGE_EMBEDDING_MODEL,
      p_match_threshold: 0.45,
    });
    if (error) throw error;
    return { knowledge: data || [], error: null };
  } catch (error) {
    await failClaimedJobs(supabase, jobs, error);
    return { knowledge: null, error };
  }
}
