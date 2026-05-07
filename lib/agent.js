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
 * Fetch agent documents for knowledge base
 */
export async function getAgentDocuments(userId) {
  const supabase = await createClient();
  
  const { data: documents, error } = await supabase
    .from('agent_documents')
    .select('filename, extracted_text')
    .eq('user_id', userId)
    .eq('is_processed', true);
  
  if (error) {
    return { documents: [], error: error.message };
  }
  
  return { documents: documents || [], error: null };
}

/**
 * Build the system prompt for the agent based on config
 */
export function buildAgentSystemPrompt(config, documents = []) {
  const parts = [];
  
  // Agent identity
  parts.push(`You are ${config.agent_name || 'Q-Agent'}, an AI assistant representing this person/business.`);
  parts.push('Your role is to help visitors learn about who they are and what they do.');
  parts.push('Be helpful, professional, and personable. Keep responses concise but informative.');
  
  // Bio
  if (config.bio) {
    parts.push('\n## About');
    parts.push(config.bio);
  }
  
  // Skills
  if (config.skills && Array.isArray(config.skills) && config.skills.length > 0) {
    parts.push('\n## Skills & Expertise');
    config.skills.forEach(skill => {
      if (typeof skill === 'string') {
        parts.push(`- ${skill}`);
      } else if (skill.name) {
        parts.push(`- ${skill.name}${skill.level ? ` (${skill.level})` : ''}`);
      }
    });
  }
  
  // Projects
  if (config.projects && Array.isArray(config.projects) && config.projects.length > 0) {
    parts.push('\n## Projects & Work');
    config.projects.forEach(project => {
      if (typeof project === 'string') {
        parts.push(`- ${project}`);
      } else if (project.name) {
        let projectLine = `- ${project.name}`;
        if (project.description) projectLine += `: ${project.description}`;
        if (project.url) projectLine += ` (${project.url})`;
        parts.push(projectLine);
      }
    });
  }
  
  // Contact info
  if (config.contact_info && typeof config.contact_info === 'object') {
    const contact = config.contact_info;
    parts.push('\n## Contact Information');
    if (contact.email) parts.push(`- Email: ${contact.email}`);
    if (contact.phone) parts.push(`- Phone: ${contact.phone}`);
    if (contact.location) parts.push(`- Location: ${contact.location}`);
    if (contact.website) parts.push(`- Website: ${contact.website}`);
    if (contact.calendly) parts.push(`- Book a meeting: ${contact.calendly}`);
  }
  
  // Social links
  if (config.social_links && Array.isArray(config.social_links) && config.social_links.length > 0) {
    parts.push('\n## Social Media & Links');
    config.social_links.forEach(link => {
      if (typeof link === 'string') {
        parts.push(`- ${link}`);
      } else if (link.platform && link.url) {
        parts.push(`- ${link.platform}: ${link.url}`);
      }
    });
  }
  
  // Custom knowledge
  if (config.custom_knowledge) {
    parts.push('\n## Additional Information');
    parts.push(config.custom_knowledge);
  }
  
  // Uploaded documents
  if (documents.length > 0) {
    parts.push('\n## Documents & Files');
    documents.forEach(doc => {
      if (doc.extracted_text) {
        parts.push(`\n### ${doc.filename}`);
        parts.push(doc.extracted_text.substring(0, 5000)); // Limit to avoid token overflow
      }
    });
  }
  
  // Behavior guidelines
  parts.push('\n## Guidelines');
  parts.push('- Answer questions about skills, experience, and projects enthusiastically');
  parts.push('- If asked about contact or booking, provide the relevant contact information');
  parts.push('- Be conversational and friendly while staying professional');
  parts.push('- If you don\'t know something specific, acknowledge it and suggest contacting directly');
  parts.push('- Never make up information that isn\'t provided above');
  
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
