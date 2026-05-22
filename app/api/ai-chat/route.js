import { createAdminClient, createClient } from '@/utils/supabase/server';
import { buildAgentSystemPrompt, getAgentKnowledge } from '@/lib/agent';
import { getMessageLimit, isSubscriptionLive, normalizeTier } from '@/lib/plans';
import { cookies } from 'next/headers';

export const maxDuration = 30;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createAssistantPersistenceStream(conversationId, supabase) {
  const decoder = new TextDecoder();
  let buffer = '';
  let assistantContent = '';

  const readStreamLine = (line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine === 'data: [DONE]' || !trimmedLine.startsWith('data: ')) {
      return;
    }

    try {
      const data = JSON.parse(trimmedLine.substring(6));
      assistantContent += data.choices?.[0]?.delta?.content || '';
    } catch {
      // Ignore incomplete or non-JSON stream frames.
    }
  };

  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(readStreamLine);
    },
    async flush() {
      buffer += decoder.decode();
      if (buffer) readStreamLine(buffer);

      if (!conversationId || !assistantContent.trim()) return;

      const { error } = await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
      });

      if (error) {
        console.error('[AI Chat] Failed to save assistant message:', error);
      }
    },
  });
}

export async function POST(req) {
  try {
    const {
      messages,
      username,
      visitorId,
      conversationId,
      visitorName,
      visitorEmail,
      accessPassword,
    } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service is not configured' }), { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const adminSupabase = createAdminClient();

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

    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .select('tier, status, trial_ends_at, messages_used')
      .eq('user_id', profile.id)
      .single();

    if (subscriptionError || !subscription) {
      return new Response(JSON.stringify({ error: 'Agent subscription not found' }), { status: 403 });
    }

    const tier = normalizeTier(subscription.tier);

    if (!isSubscriptionLive(subscription)) {
      return new Response(JSON.stringify({ error: 'Agent is not active on the current plan' }), { status: 403 });
    }

    const messageLimit = getMessageLimit(tier);
    if ((subscription.messages_used || 0) >= messageLimit) {
      return new Response(JSON.stringify({ error: 'This agent has reached its monthly message limit' }), { status: 429 });
    }

    const accessLevel = config.access_level || 'public';
    if (accessLevel === 'password' && accessPassword !== config.access_password) {
      return new Response(JSON.stringify({ error: 'Incorrect access password' }), { status: 403 });
    }

    if (accessLevel === 'email' && !isValidEmail(visitorEmail)) {
      return new Response(JSON.stringify({ error: 'A valid email is required to chat with this agent' }), { status: 403 });
    }

    // Handle knowledge base and prompt
    const { knowledge: documents } = await getAgentKnowledge(profile.id, supabase);
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

    const responseBody = activeConversationId
      ? groqResponse.body.pipeThrough(createAssistantPersistenceStream(activeConversationId, supabase))
      : groqResponse.body;

    // Pass the stream back to the browser with the conversation ID in headers
    return new Response(responseBody, {
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
