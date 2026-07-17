import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { selectRelevantKnowledge } from './agent-prompt.js';

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
  
  // 1. Fetch manual knowledge facts
  const { data: manualFacts, error: manualError } = await supabase
    .from('agent_knowledge')
    .select('title, content, source_type')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(100);
  
  // 2. Fetch processed documents with extracted text
  const { data: documents, error: docsError } = await supabase
    .from('agent_documents')
    .select('filename, extracted_text')
    .eq('user_id', userId)
    .eq('is_processed', true)
    .not('extracted_text', 'is', null)
    .limit(25);

  if (manualError || docsError) {
    console.warn('Error fetching knowledge:', manualError || docsError);
  }
  
  // Map documents to the same format as facts for the prompt builder
  const docFacts = (documents || []).map(doc => ({
    title: `Document: ${doc.filename}`,
    content: doc.extracted_text,
    source_type: 'file'
  }));

  return {
    knowledge: selectRelevantKnowledge([...(manualFacts || []), ...docFacts], query),
    error: manualError || docsError 
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
