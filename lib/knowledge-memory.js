import 'server-only';
import {
  generateKnowledgeEmbeddings,
  isKnowledgeEmbeddingsEnabled,
  KNOWLEDGE_EMBEDDING_MODEL,
} from './knowledge-embeddings.js';

const MAX_INTENT_JOBS = 16;

export function isKnowledgeMemoryEnabled() {
  return process.env.KNOWLEDGE_MEMORY_ENABLED === '1';
}
async function failIntentJobs(supabase, jobs, error) {
  if (!jobs.length) return;
  const message = error instanceof Error ? error.message : 'Intent embedding failed';
  const { error: failureError } = await supabase.rpc('fail_agent_intent_embedding_jobs', {
    p_gap_ids: jobs.map((job) => job.gap_id),
    p_error: message.slice(0, 500),
  });
  if (failureError) console.warn('Unable to record failed intent embedding jobs:', failureError.message);
}

async function embedPendingIntents(supabase, ownerId, limit) {
  if (!isKnowledgeEmbeddingsEnabled()) return { claimed: 0, stored: 0, failed: 0 };

  const { data: jobs, error } = await supabase.rpc('claim_agent_intent_embedding_jobs', {
    p_limit: Math.max(1, Math.min(Number(limit) || 12, MAX_INTENT_JOBS)),
    p_owner_id: ownerId,
  });
  if (error) throw error;
  if (!jobs?.length) return { claimed: 0, stored: 0, failed: 0 };

  try {
    const embeddings = await generateKnowledgeEmbeddings(
      jobs.map((job) => String(job.normalized_question || job.question || '').slice(0, 2_000)),
    );
    const { data, error: storeError } = await supabase.rpc('store_agent_intent_embeddings', {
      p_model: KNOWLEDGE_EMBEDDING_MODEL,
      p_embeddings: jobs.map((job, index) => ({ id: job.gap_id, embedding: embeddings[index] })),
    });
    if (storeError) throw storeError;
    return { claimed: jobs.length, stored: Number(data) || 0, failed: 0 };
  } catch (embeddingError) {
    await failIntentJobs(supabase, jobs, embeddingError);
    return { claimed: jobs.length, stored: 0, failed: jobs.length, error: embeddingError };
  }
}

export async function processKnowledgeMemory({ supabase, ownerId = null, limit = 12 } = {}) {
  if (!isKnowledgeMemoryEnabled()) {
    return {
      enabled: false,
      intentEmbeddings: { claimed: 0, stored: 0, failed: 0 },
      patterns: { observation_patterns: 0, change_patterns: 0, intent_patterns: 0 },
    };
  }

  const intentEmbeddings = await embedPendingIntents(supabase, ownerId, limit);
  const { data: patterns, error } = await supabase.rpc('refresh_agent_memory_patterns', {
    p_owner_id: ownerId,
    p_intent_similarity: 0.82,
  });
  if (error) throw error;
  return {
    enabled: true,
    intentEmbeddings,
    patterns: patterns || { observation_patterns: 0, change_patterns: 0, intent_patterns: 0 },
  };
}

export async function searchTemporalKnowledge({ supabase, ownerId, query, limit = 10 } = {}) {
  const normalizedQuery = String(query || '').trim().slice(0, 2_000);
  if (!isKnowledgeMemoryEnabled() || !normalizedQuery) return { knowledge: [], error: null };

  const { data, error } = await supabase.rpc('search_agent_temporal_memory', {
    p_owner_id: ownerId,
    p_query: normalizedQuery,
    p_limit: Math.max(1, Math.min(Number(limit) || 10, 16)),
  });
  if (error) return { knowledge: [], error };

  return {
    knowledge: (data || []).map((memory) => ({
      title: memory.title,
      source_title: `Owner-approved temporal memory for ${memory.entity_name}`,
      source_type: 'temporal_memory',
      source_id: memory.memory_id,
      source_key: `memory:${memory.memory_id}`,
      content: memory.content,
      evidence_status: 'verified',
      verified_at: memory.occurred_at,
      priority: 4,
      retrieval_rank: Math.max(0, Number(memory.retrieval_rank) || 0) * 10,
      knowledge_kind: 'temporal_memory',
      temporal_kind: memory.memory_kind,
      temporal_entity: memory.entity_name,
      occurred_at: memory.occurred_at,
      expires_at: memory.expires_at,
      support_count: Math.max(1, Number(memory.support_count) || 1),
      confidence: Math.max(0, Math.min(1, Number(memory.confidence) || 0)),
      consent_basis: memory.consent_basis,
    })),
    error: null,
  };
}
