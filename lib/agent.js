import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { buildKnowledgeChunks, selectRelevantKnowledge } from './knowledge-retrieval.js';
import { searchHybridKnowledge } from './knowledge-embeddings.js';
import { searchConnectedKnowledge } from './knowledge-graph.js';
import { searchTemporalKnowledge } from './knowledge-memory.js';

export { buildAgentSystemPrompt } from './agent-prompt.js';

async function getSupabaseClient(supabaseClient) {
  if (supabaseClient) return supabaseClient;

  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Fetch agent configuration by username
 */
export async function getAgentConfigByUsername(username, supabaseClient) {
  const supabase = await getSupabaseClient(supabaseClient);
  
  // First get the profile ID from username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  
  if (profileError || !profile) {
    return { config: null, error: 'User not found' };
  }
  
  // Then get the agent config
  const { data: config, error: configError } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', profile.id)
    .single();
  
  if (configError || !config) {
    return { config: null, error: 'Agent not configured' };
  }
  
  return { config, error: null };
}

/**
 * Fetch agent knowledge base items (manual facts and uploaded documents)
 */
export async function getAgentKnowledge(userId, supabaseClient, query = '') {
  const supabase = await getSupabaseClient(supabaseClient);

  const [hybridResult, graphResult, memoryResult] = await Promise.all([
    searchHybridKnowledge({ supabase, ownerId: userId, query }),
    searchConnectedKnowledge({ supabase, ownerId: userId, query }),
    searchTemporalKnowledge({ supabase, ownerId: userId, query }),
  ]);
  const { knowledge: hybridChunks, error: hybridError } = hybridResult;
  const connectedKnowledge = graphResult.knowledge || [];
  const temporalKnowledge = memoryResult.knowledge || [];

  if (hybridError) {
    console.warn('Semantic knowledge retrieval unavailable; using lexical retrieval:', hybridError.message);
  }
  if (graphResult.error) {
    console.warn('Connected knowledge retrieval unavailable; using source retrieval:', graphResult.error.message);
  }
  if (memoryResult.error) {
    console.warn('Temporal knowledge retrieval unavailable; using source retrieval:', memoryResult.error.message);
  }

  if (hybridChunks?.length) {
    return {
      knowledge: selectRelevantKnowledge([
        ...temporalKnowledge,
        ...connectedKnowledge,
        ...hybridChunks.map((chunk) => ({
          ...chunk,
          title: chunk.source_title,
          source_id: chunk.knowledge_id || chunk.document_id,
          source_key: chunk.knowledge_id
            ? `knowledge:${chunk.knowledge_id}`
            : `document:${chunk.document_id}`,
        })),
      ], query),
      error: null,
    };
  }

  const { data: indexedChunks, error: indexedError } = await supabase.rpc('search_agent_knowledge_chunks', {
    p_owner_id: userId,
    p_query: String(query || '').slice(0, 2_000),
    p_limit: 80,
  });

  if (!indexedError && indexedChunks?.length) {
    return {
      knowledge: selectRelevantKnowledge([
        ...temporalKnowledge,
        ...connectedKnowledge,
        ...indexedChunks.map((chunk) => ({
          ...chunk,
          title: chunk.source_title,
          source_id: chunk.knowledge_id || chunk.document_id,
          source_key: chunk.knowledge_id
            ? `knowledge:${chunk.knowledge_id}`
            : `document:${chunk.document_id}`,
        })),
      ], query),
      error: null,
    };
  }

  if (indexedError && indexedError.code !== 'PGRST202') {
    console.warn('Chunk index unavailable; using compatibility retrieval:', indexedError.message);
  }

  // Compatibility path for environments that have not applied the chunk-index migration yet,
  // and for queries with no lexical index matches.
  const { data: manualFacts, error: manualError } = await supabase
    .from('agent_knowledge')
    .select('id, title, content, source_type, source_url, priority, category')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(100);

  const { data: documents, error: docsError } = await supabase
    .from('agent_documents')
    .select('id, filename, extracted_text, updated_at')
    .eq('user_id', userId)
    .eq('is_processed', true)
    .not('extracted_text', 'is', null)
    .limit(25);

  if (manualError || docsError) {
    console.warn('Error fetching knowledge:', manualError || docsError);
  }
  
  const factSources = (manualFacts || []).map((fact) => ({
    ...fact,
    knowledge_id: fact.id,
    source_id: fact.id,
    source_title: fact.title,
    evidence_status: 'verified',
  }));
  const docFacts = (documents || []).map(doc => ({
    document_id: doc.id,
    source_id: doc.id,
    title: `Document: ${doc.filename}`,
    source_title: doc.filename,
    content: doc.extracted_text,
    source_type: 'file',
    evidence_status: 'verified',
  }));

  return {
    knowledge: selectRelevantKnowledge([
      ...temporalKnowledge,
      ...connectedKnowledge,
      ...buildKnowledgeChunks([...factSources, ...docFacts]),
    ], query),
    error: manualError || docsError,
  };
}

/**
 * Get user's agent config
 */
export async function getUserAgentConfig(userId, supabaseClient) {
  const supabase = await getSupabaseClient(supabaseClient);
  
  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { config: data, error };
}

/**
 * Create or update agent config
 */
export async function upsertAgentConfig(userId, configData, supabaseClient) {
  const supabase = await getSupabaseClient(supabaseClient);
  
  const { data, error } = await supabase
    .from('agent_configs')
    .upsert({
      user_id: userId,
      ...configData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();
  
  return { config: data, error };
}
