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
 * Fetch agent knowledge base items (manual facts and uploaded documents)
 */
export async function getAgentKnowledge(userId) {
  const supabase = await createClient();
  
  // 1. Fetch manual knowledge facts
  const { data: manualFacts, error: manualError } = await supabase
    .from('agent_knowledge')
    .select('title, content, source_type')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // 2. Fetch processed documents with extracted text
  const { data: documents, error: docsError } = await supabase
    .from('agent_documents')
    .select('filename, extracted_text')
    .eq('user_id', userId)
    .eq('is_processed', true)
    .not('extracted_text', 'is', null);

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
    knowledge: [...(manualFacts || []), ...docFacts], 
    error: manualError || docsError 
  };
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
  
  // 5. Contact & Booking Information
  if (config.contact_info) {
    const { email, phone, location, website, calendly } = config.contact_info;
    if (email || phone || location || website || calendly) {
      parts.push('\n### CONTACT & BOOKING INFORMATION');
      if (email) parts.push(`- Email: ${email}`);
      if (phone) parts.push(`- Phone: ${phone}`);
      if (location) parts.push(`- Location: ${location}`);
      if (website) parts.push(`- Website: ${website}`);
      if (calendly) parts.push(`- Booking/Calendar Link: ${calendly}`);
    }
  }

  // 6. Social Media Links
  if (config.social_links && Array.isArray(config.social_links) && config.social_links.length > 0) {
    parts.push('\n### SOCIAL MEDIA PROFILES');
    config.social_links.forEach(link => {
      parts.push(`- ${link.platform}: ${link.url}`);
    });
  }
  
  // 7. Custom Knowledge & Training Data
  if (config.custom_knowledge) {
    parts.push('\n### ADDITIONAL CONTEXT');
    parts.push(config.custom_knowledge);
  }
  
  if (documents && documents.length > 0) {
    parts.push('\n### NEURAL KNOWLEDGE BASE');
    parts.push('Use the following facts and details to answer questions accurately:');
    documents.forEach(item => {
      // Truncate individual items to avoid hitting token limits while maintaining context
      const content = item.content?.length > 2000 
        ? item.content.substring(0, 2000) + '... [Content Truncated]' 
        : item.content;
        
      parts.push(`\n[Fact: ${item.title}]\n${content}`);
    });
  }
  
  // 8. Interaction Rules
  parts.push('\n### RULES OF ENGAGEMENT');
  parts.push(`1. IDENTITY: You are ${config.agent_name}, the digital representative of this user. Introduce yourself ONLY at the very beginning of a conversation. DO NOT repeat your name or identity in every message.`);
  parts.push('2. PROACTIVE ADVOCACY: Your job is to make the user look like a rockstar. Use the provided skills and projects to build credibility.');
  parts.push('3. STRICT TRUTH ONLY: NEVER invent contact information, social media handles, or booking links. Only provide info listed in the sections above. If a visitor asks for contact info that isn\'t provided, simply say that the user hasn\'t added that specific detail to your database yet.');
  parts.push('4. INTELLIGENT EXPANSION: You can professionally expand on skills and project descriptions to explain their value, but NEVER expand on personal contact details.');
  parts.push('5. CONVERSATIONAL FLOW: Don\'t just list facts. Connect the user\'s background to the visitor\'s potential needs.');
  parts.push('6. FORMATTING: ALWAYS use highly structured markdown. Break down your responses into easily scannable sections using clear headings (###), bullet points, and **bold text** for emphasis. Use relevant emojis strategically. NEVER output a single large block of text.');
  
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
