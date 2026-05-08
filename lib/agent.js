import { createClient } from '@/utils/supabase/server';

/**
 * Fetch agent configuration by username
 */
export async function getAgentConfigByUsername(username) {
  const supabase = await createClient();
  
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
 * Fetch agent knowledge base items
 */
export async function getAgentKnowledge(userId) {
  const supabase = await createClient();
  
  const { data: knowledge, error } = await supabase
    .from('agent_knowledge')
    .select('title, content, source_type')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    return { knowledge: [], error: error.message };
  }
  
  return { knowledge: knowledge || [], error: null };
}

/**
 * Build the system prompt for the agent based on config
 */
export function buildAgentSystemPrompt(config, documents = []) {
  const parts = [];
  
  // 1. Core Identity & Tone
  const toneInstructions = {
    professional: 'Maintain a highly professional, polished, and corporate-ready persona. Use formal language and focus on value and results.',
    friendly: 'Be warm, approachable, and helpful. Use conversational language, emojis where appropriate, and feel like a supportive peer.',
    funny: 'Be witty, lighthearted, and entertaining. Use humor and personality, but ensure the core information remains accurate.',
    creative: 'Be imaginative, bold, and visionary. Use evocative language and focus on the "big picture" and innovation.'
  };

  const selectedTone = toneInstructions[config.tone?.toLowerCase()] || toneInstructions.professional;

  parts.push(`You are ${config.agent_name || 'Q-Agent'}, the official digital twin and AI representative for this user.`);
  parts.push(`PERSONALITY GUIDELINE: ${selectedTone}`);
  parts.push('Your goal is to represent the user perfectly, answering questions about their background, skills, and work.');
  parts.push('IMPORTANT: If the user provided brief info, expand on it professionally. For example, if they list "React" as a skill, you can talk about their expertise in building modern, responsive web applications.');
  
  // 2. Knowledge Base - Bio
  if (config.bio) {
    parts.push('\n### USER BIO & BACKGROUND');
    parts.push(config.bio);
  }
  
  // 3. Skills Injection
  if (config.skills && Array.isArray(config.skills) && config.skills.length > 0) {
    parts.push('\n### CORE COMPETENCIES');
    config.skills.forEach(skill => {
      const name = typeof skill === 'string' ? skill : skill.name;
      const level = skill.level ? ` (${skill.level} proficiency)` : '';
      parts.push(`- ${name}${level}`);
    });
  }
  
  // 4. Projects Injection
  if (config.projects && Array.isArray(config.projects) && config.projects.length > 0) {
    parts.push('\n### KEY PROJECTS & ACHIEVEMENTS');
    config.projects.forEach(project => {
      if (typeof project === 'string') {
        parts.push(`- ${project}`);
      } else if (project.name) {
        parts.push(`- **${project.name}**: ${project.description || ''} ${project.url ? `(Link: ${project.url})` : ''}`);
      }
    });
  }
  
  // 5. Custom Knowledge & Training Data
  if (config.custom_knowledge) {
    parts.push('\n### ADDITIONAL CONTEXT');
    parts.push(config.custom_knowledge);
  }
  
  if (documents && documents.length > 0) {
    parts.push('\n### NEURAL KNOWLEDGE BASE');
    parts.push('Use the following facts and details to answer questions accurately:');
    documents.forEach(item => {
      parts.push(`\n[Fact: ${item.title}]\n${item.content}`);
    });
  }
  
  // 6. Interaction Rules
  parts.push('\n### RULES OF ENGAGEMENT');
  parts.push(`1. YOU ARE THE DIGITAL TWIN: Never say "I am an AI assistant for ${config.agent_name}". Instead, say "I'm ${config.agent_name}, [User]'s digital representative."`);
  parts.push('2. PROACTIVE ADVOCACY: Your job is to make the user look like a rockstar. Use the provided skills and projects to build credibility.');
  parts.push('3. INTELLIGENT EXPANSION: If the user provided a list of skills, explain the value of those skills to a potential client or employer.');
  parts.push('4. CONVERSATIONAL FLOW: Don\'t just list facts. Connect the user\'s background to the visitor\'s potential needs.');
  parts.push('5. DIRECT ACTION: If a visitor asks how to work with the user, provide the contact info or booking link immediately.');
  
  return parts.join('\n');
}

/**
 * Create or update a conversation record
 */
export async function createConversation(agentOwnerId, visitorId, visitorInfo = {}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      agent_owner_id: agentOwnerId,
      visitor_id: visitorId,
      visitor_ip: visitorInfo.ip || null,
      visitor_location: visitorInfo.location || null,
      visitor_device: visitorInfo.device || null,
    })
    .select()
    .single();
  
  return { conversation: data, error };
}

/**
 * Save a message to the conversation
 */
export async function saveMessage(conversationId, role, content) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('agent_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    });
  
  // Update message count
  if (!error) {
    await supabase.rpc('increment_message_count', { conv_id: conversationId });
  }
  
  return { error };
}

/**
 * Get user's agent config
 */
export async function getUserAgentConfig(userId) {
  const supabase = await createClient();
  
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
export async function upsertAgentConfig(userId, configData) {
  const supabase = await createClient();
  
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
