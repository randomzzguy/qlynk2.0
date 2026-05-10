import { createClient } from '@/utils/supabase/server';
import { buildAgentSystemPrompt, getAgentKnowledge } from '@/lib/agent';
import { cookies } from 'next/headers';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages, username, visitorId, conversationId, visitorName, visitorEmail } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Get agent config
    const { data: config } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (!config || !config.is_enabled) {
      return new Response(JSON.stringify({ error: 'Agent not available' }), { status: 404 });
    }

    // Handle knowledge base and prompt
    const { knowledge: documents } = await getAgentKnowledge(profile.id);
    const systemPrompt = buildAgentSystemPrompt(config, documents);

    // 1. CONVERSATION TRACKING
    let activeConversationId = conversationId;

    if (!activeConversationId && visitorId) {
      const { data: newConv } = await supabase
        .from('agent_conversations')
        .insert({
          agent_owner_id: profile.id,
          visitor_id: visitorId,
          visitor_name: visitorName || null,
          visitor_email: visitorEmail || null,
        })
        .select('id')
        .single();
      activeConversationId = newConv?.id;
    }

    // 2. SAVE USER MESSAGE
    if (activeConversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      await supabase.from('agent_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: lastMessage.content
      });
    }

    // TALK DIRECTLY TO GROQ
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json();
      throw new Error(error.error?.message || 'Groq connection failed');
    }

    // Pass the stream directly back to the browser with the conversation ID in headers
    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'x-conversation-id': activeConversationId || '',
      },
    });
  } catch (error) {
    console.error('[Library-Free-Chat] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
