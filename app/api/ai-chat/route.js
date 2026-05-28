import { createAdminClient, createClient } from '@/utils/supabase/server';
import { buildAgentSystemPrompt, getAgentKnowledge } from '@/lib/agent';
import { getMessageLimit, isSubscriptionLive, normalizeTier } from '@/lib/plans';
import { rateLimitResponse } from '@/lib/rate-limit';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email/send';
import { newMessageEmail } from '@/lib/email/templates/new-message';

export const maxDuration = 30;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function analyzeAndSaveSentiment(conversationId, supabase) {
  try {
    // 1. Fetch user's message logs for this conversation
    const { data: messages, error: fetchErr } = await supabase
      .from('agent_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(12);

    if (fetchErr || !messages || messages.length === 0) return;

    // Filter user messages to gauge accurate guest sentiment
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    if (userMessages.length === 0) return;

    // 2. Query Groq's fast Llama-3-8b model for instant classification
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: "You are a sentiment classifier. Analyze the user's sentiment based on their messages in the chat history. Choose exactly one of these labels: 'positive', 'neutral', or 'negative'. Reply with ONLY the raw lowercase label. No explanation, no intro, no punctuation."
          },
          {
            role: 'user',
            content: `Messages to analyze:\n${userMessages.map(msg => `- "${msg}"`).join('\n')}`
          }
        ],
        temperature: 0.1,
        max_tokens: 10,
      })
    });

    if (!groqResponse.ok) return;

    const resData = await groqResponse.json();
    const sentiment = resData.choices?.[0]?.message?.content?.trim()?.toLowerCase();

    if (['positive', 'neutral', 'negative'].includes(sentiment)) {
      // 3. Update conversation sentiment
      await supabase
        .from('agent_conversations')
        .update({ sentiment })
        .eq('id', conversationId);
    }
  } catch (err) {
    console.error('[Sentiment Analysis Background Task Error]:', err);
  }
}

function createAssistantPersistenceStream(conversationId, supabase, adminSupabase) {
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
      } else {
        // Perform sentiment analysis in the background
        analyzeAndSaveSentiment(conversationId, adminSupabase).catch(err => {
          console.error('[Background Sentiment Async Catch]:', err);
        });
      }
    },
  });
}

export async function POST(req) {
  // Rate limit: 20 requests per minute per IP
  const rateLimit = rateLimitResponse(req, 'ai-chat', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

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

      // Notify the agent owner of the new conversation (fire-and-forget)
      if (newConv?.id) {
        const { data: ownerAuthUser } = await adminSupabase.auth.admin.getUserById(profile.id);
        const ownerEmail = ownerAuthUser?.user?.email;
        const ownerNotifEnabled = ownerAuthUser?.user?.user_metadata?.notif_new_message !== false;
        if (ownerEmail && ownerNotifEnabled) {
          const firstUserMessage = messages[messages.length - 1]?.content;
          sendEmail({
            to: ownerEmail,
            ...newMessageEmail({
              visitorName: visitorName || null,
              visitorEmail: visitorEmail || null,
              messagePreview: firstUserMessage || null,
              conversationsUrl: `https://qlynk.site/dashboard/conversations`,
            }),
          }).then(() => {
            adminSupabase
              .from('agent_conversations')
              .update({ email_notified: true })
              .eq('id', newConv.id)
              .then(() => {})
              .catch(() => {});
          }).catch((err) => console.error('[AI Chat] New message email failed:', err));
        }
      }
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
      ? groqResponse.body.pipeThrough(createAssistantPersistenceStream(activeConversationId, supabase, adminSupabase))
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
