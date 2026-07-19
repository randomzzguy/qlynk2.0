import { createAdminClient } from '@/utils/supabase/server';
import { createHash } from 'node:crypto';
import { buildAgentSystemPrompt, getAgentKnowledge } from '@/lib/agent';
import { getMessageLimit, isSubscriptionLive, normalizeTier } from '@/lib/plans';
import { checkRateLimitKey, rateLimitResponse, rateLimitResponseForKey } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';
import { newMessageEmail } from '@/lib/email/templates/new-message';
import { compare } from 'bcryptjs';
import {
  buildScopeClassifierPrompt,
  detectDirectPolicyAttack,
  getScopeRefusalMessage,
  parseScopeDecision,
} from '@/lib/agent-prompt';
import { normalizeAgentRules } from '@/lib/agent-rules';
import { normalizeKnowledgeGapQuestion, shouldRecordKnowledgeGap } from '@/lib/knowledge-gaps';

export const maxDuration = 30;

const MAX_REQUEST_CHARS = 64_000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_MESSAGE_CHARS = 24_000;
const MAX_OUTPUT_TOKENS = 800;
const VISITOR_REQUESTS_PER_MINUTE = 10;
const VISITOR_REQUESTS_PER_DAY = 100;
const AGENT_REQUESTS_PER_MINUTE = 120;
const POLICY_BLOCKS_PER_HOUR = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/i;
const UNSAFE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function jsonError(error, status) {
  return Response.json({ error }, { status });
}

function hashSecurityIdentifier(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function classifyRequestScope({ config, rules, latestMessage, trustedHistory }) {
  const classifierPrompt = buildScopeClassifierPrompt({
    config,
    rules,
    message: latestMessage.content,
    recentUserMessages: trustedHistory
      .filter((message) => message.role === 'user')
      .slice(-3)
      .map((message) => message.content),
  });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: classifierPrompt }],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!response.ok) throw new Error(`Scope classifier returned ${response.status}`);
    const data = await response.json();
    return parseScopeDecision(data.choices?.[0]?.message?.content, rules.scope_mode);
  } catch (error) {
    console.error('[AI Chat] Scope classifier unavailable:', error.message);
    return rules.scope_mode === 'strict' ? 'BLOCK_SCOPE' : 'ALLOW';
  }
}

async function createStaticAssistantResponse({ content, conversationId, adminSupabase }) {
  const { error } = await adminSupabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content,
  });

  if (error) console.error('[AI Chat] Failed to save scoped refusal:', error.message);

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'x-conversation-id': conversationId || '',
    },
  });
}

async function parseChatRequest(req) {
  const rawBody = await req.text();
  if (rawBody.length > MAX_REQUEST_CHARS) {
    return { error: 'Request body is too large', status: 413 };
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { error: 'Invalid JSON body', status: 400 };
  }

  const {
    messages,
    username,
    visitorId,
    conversationId,
    visitorName,
    visitorEmail,
    accessPassword,
  } = body || {};

  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return { error: 'Invalid username', status: 400 };
  }

  if (typeof visitorId !== 'string' || !UUID_PATTERN.test(visitorId)) {
    return { error: 'Invalid visitor identifier', status: 400 };
  }

  if (conversationId != null &&
      (typeof conversationId !== 'string' || !UUID_PATTERN.test(conversationId))) {
    return { error: 'Invalid conversation identifier', status: 400 };
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_HISTORY_MESSAGES) {
    return { error: `Messages must contain between 1 and ${MAX_HISTORY_MESSAGES} items`, status: 400 };
  }

  let totalChars = 0;
  const sanitizedMessages = [];

  for (const message of messages) {
    if (!message || !['user', 'assistant'].includes(message.role)) {
      return { error: 'Only user and assistant message roles are allowed', status: 400 };
    }

    if (typeof message.content !== 'string') {
      return { error: 'Each message must contain text content', status: 400 };
    }

    const content = message.content.replace(UNSAFE_CONTROL_CHARS, '').trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) {
      return { error: `Each message must contain 1-${MAX_MESSAGE_CHARS} characters`, status: 400 };
    }

    totalChars += content.length;
    if (totalChars > MAX_TOTAL_MESSAGE_CHARS) {
      return { error: 'Message history is too large', status: 413 };
    }

    sanitizedMessages.push({ role: message.role, content });
  }

  const latestMessage = sanitizedMessages[sanitizedMessages.length - 1];
  if (latestMessage.role !== 'user') {
    return { error: 'The latest message must be from the user', status: 400 };
  }

  return {
    value: {
      username,
      visitorId,
      conversationId: conversationId || null,
      visitorName: typeof visitorName === 'string' ? visitorName.trim().slice(0, 100) : '',
      visitorEmail: typeof visitorEmail === 'string' ? visitorEmail.trim().slice(0, 254) : '',
      accessPassword: typeof accessPassword === 'string' ? accessPassword.slice(0, 200) : '',
      latestMessage,
    },
  };
}

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

function createAssistantPersistenceStream({ conversationId, adminSupabase, ownerId, question, uncertaintyMessage }) {
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

      const { error } = await adminSupabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
      });

      if (error) {
        console.error('[AI Chat] Failed to save assistant message:', error);
      } else {
        if (ownerId && shouldRecordKnowledgeGap(assistantContent, uncertaintyMessage)) {
          const normalizedQuestion = normalizeKnowledgeGapQuestion(question);
          if (normalizedQuestion) {
            const { error: gapError } = await adminSupabase.rpc('record_agent_knowledge_gap', {
              p_owner_id: ownerId,
              p_question: String(question || '').slice(0, 1000),
              p_normalized_question: normalizedQuestion,
              p_conversation_id: conversationId,
            });
            if (gapError) {
              console.error('[AI Chat] Failed to record knowledge gap:', gapError.message);
            }
          }
        }

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
  const rateLimit = await rateLimitResponse(req, 'ai-chat', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const parsedRequest = await parseChatRequest(req);
    if (parsedRequest.error) {
      return jsonError(parsedRequest.error, parsedRequest.status);
    }

    const {
      username,
      visitorId,
      conversationId,
      visitorName,
      visitorEmail,
      accessPassword,
      latestMessage,
    } = parsedRequest.value;

    if (!process.env.GROQ_API_KEY) {
      return jsonError('AI service is not configured', 503);
    }

    const adminSupabase = createAdminClient();

    // Get the profile
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single();

    if (!profile) {
      return jsonError('User not found', 404);
    }

    // Get agent config
    const { data: config } = await adminSupabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (!config || !config.is_enabled) {
      return jsonError('Agent not available', 404);
    }

    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .select('tier, status, trial_ends_at, messages_used')
      .eq('user_id', profile.id)
      .single();

    if (subscriptionError || !subscription) {
      return jsonError('Agent subscription not found', 403);
    }

    const tier = normalizeTier(subscription.tier);

    if (!isSubscriptionLive(subscription)) {
      return jsonError('Agent is not active on the current plan', 403);
    }

    const messageLimit = getMessageLimit(tier);

    const accessLevel = config.access_level || 'public';
    if (accessLevel === 'password') {
      const { data: credential, error: credentialError } = await adminSupabase
        .from('agent_access_credentials')
        .select('password_hash')
        .eq('user_id', profile.id)
        .maybeSingle();

      const passwordMatches = credential?.password_hash &&
        await compare(accessPassword, credential.password_hash);

      if (credentialError || !passwordMatches) {
        return jsonError('Incorrect access password', 403);
      }
    }

    if (accessLevel === 'email' && !isValidEmail(visitorEmail)) {
      return jsonError('A valid email is required to chat with this agent', 403);
    }

    const { data: ownerRules, error: ownerRulesError } = await adminSupabase
      .from('agent_rule_configs')
      .select('purpose, audience, allowed_topics, blocked_topics, behavior_rules, forbidden_behaviors, uncertainty_message, escalation_message, custom_instructions, response_length, scope_mode, daily_message_limit, prompt_version')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (ownerRulesError) {
      console.error('[AI Chat] Failed to load private agent rules:', ownerRulesError.message);
      return jsonError('Agent rules are temporarily unavailable', 503);
    }
    const effectiveRules = normalizeAgentRules(ownerRules || {}, config.agent_type || 'personal');

    const agentBurstLimit = await rateLimitResponseForKey(
      profile.id,
      'ai-chat-agent-minute',
      AGENT_REQUESTS_PER_MINUTE,
      60 * 1000
    );
    if (agentBurstLimit) return agentBurstLimit;

    const visitorMinuteLimit = await rateLimitResponseForKey(
      `${profile.id}:${visitorId}`,
      'ai-chat-visitor-minute',
      VISITOR_REQUESTS_PER_MINUTE,
      60 * 1000
    );
    if (visitorMinuteLimit) return visitorMinuteLimit;

    const visitorDailyLimit = await rateLimitResponseForKey(
      `${profile.id}:${visitorId}`,
      'ai-chat-visitor-day',
      VISITOR_REQUESTS_PER_DAY,
      24 * 60 * 60 * 1000
    );
    if (visitorDailyLimit) return visitorDailyLimit;

    if (effectiveRules.daily_message_limit) {
      const agentDailyLimit = await rateLimitResponseForKey(
        profile.id,
        'ai-chat-agent-day',
        Math.min(effectiveRules.daily_message_limit, messageLimit),
        24 * 60 * 60 * 1000
      );
      if (agentDailyLimit) return agentDailyLimit;
    }

    // 1. CONVERSATION TRACKING
    let activeConversationId = conversationId;
    let trustedHistory = [];

    if (activeConversationId) {
      const { data: existingConversation, error: conversationError } = await adminSupabase
        .from('agent_conversations')
        .select('id, agent_owner_id, visitor_id')
        .eq('id', activeConversationId)
        .maybeSingle();

      if (conversationError || !existingConversation) {
        return jsonError('Conversation not found', 404);
      }

      if (existingConversation.agent_owner_id !== profile.id ||
          existingConversation.visitor_id !== visitorId) {
        return jsonError('Conversation does not belong to this visitor and agent', 403);
      }

      const { data: storedMessages, error: historyError } = await adminSupabase
        .from('agent_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY_MESSAGES - 1);

      if (historyError) {
        console.error('[AI Chat] Failed to load conversation history:', historyError.message);
        return jsonError('Unable to load conversation history', 500);
      }

      trustedHistory = (storedMessages || [])
        .reverse()
        .map((message) => ({
          role: message.role,
          content: String(message.content || '').slice(0, MAX_MESSAGE_CHARS),
        }));
    }

    const { data: creditRows, error: creditError } = await adminSupabase.rpc('consume_agent_message_credit', {
      p_owner_id: profile.id,
      p_message_limit: messageLimit,
    });
    const credit = creditRows?.[0];
    if (creditError || !credit) {
      console.error('[AI Chat] Unable to reserve message credit:', creditError?.message || 'No result');
      return jsonError('Unable to verify agent usage right now', 503);
    }
    if (!credit.allowed) {
      return jsonError('This agent has reached its monthly message limit', 429);
    }

    if (!activeConversationId) {
      const { data: newConv, error: newConversationError } = await adminSupabase
        .from('agent_conversations')
        .insert({
          agent_owner_id: profile.id,
          visitor_id: visitorId,
          visitor_name: visitorName || null,
          visitor_email: visitorEmail || null,
        })
        .select('id')
        .single();

      if (newConversationError || !newConv) {
        console.error('[AI Chat] Failed to create conversation:', newConversationError?.message);
        return jsonError('Unable to start a conversation', 500);
      }

      activeConversationId = newConv?.id;

      // Notify the agent owner of the new conversation (fire-and-forget)
      if (newConv?.id) {
        const { data: ownerAuthUser } = await adminSupabase.auth.admin.getUserById(profile.id);
        const ownerEmail = ownerAuthUser?.user?.email;
        const ownerNotifEnabled = ownerAuthUser?.user?.user_metadata?.notif_new_message !== false;
        if (ownerEmail && ownerNotifEnabled) {
          sendEmail({
            to: ownerEmail,
            ...newMessageEmail({
              visitorName: visitorName || null,
              visitorEmail: visitorEmail || null,
              messagePreview: latestMessage.content,
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
    if (activeConversationId) {
      const { error: userMessageError } = await adminSupabase.from('agent_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: latestMessage.content
      });

      if (userMessageError) {
        console.error('[AI Chat] Failed to save user message:', userMessageError.message);
        return jsonError('Unable to save the message', 500);
      }
    }

    const scopeDecision = detectDirectPolicyAttack(latestMessage.content)
      || await classifyRequestScope({
        config,
        rules: effectiveRules,
        latestMessage,
        trustedHistory,
      });

    if (scopeDecision !== 'ALLOW') {
      const directAttack = Boolean(detectDirectPolicyAttack(latestMessage.content));
      const eventType = scopeDecision === 'BLOCK_SAFETY'
        ? 'safety'
        : directAttack ? 'prompt_injection' : 'off_topic';
      const visitorSecurityKey = `${profile.id}:${visitorId}`;
      const blockLimit = await checkRateLimitKey(
        visitorSecurityKey,
        'ai-chat-policy-blocks',
        POLICY_BLOCKS_PER_HOUR,
        60 * 60 * 1000
      );

      adminSupabase.from('agent_security_events').insert({
        agent_owner_id: profile.id,
        event_type: eventType,
        visitor_key_hash: hashSecurityIdentifier(visitorSecurityKey),
        metadata: {
          agent_type: config.agent_type || 'personal',
          prompt_version: ownerRules?.prompt_version || 0,
        },
      }).then(() => {}).catch((error) => {
        console.error('[AI Chat] Failed to record security event:', error.message);
      });

      return createStaticAssistantResponse({
        content: blockLimit.allowed
          ? getScopeRefusalMessage(effectiveRules, scopeDecision)
          : 'This visitor has made too many blocked requests. Please wait before trying again or contact the agent owner.',
        conversationId: activeConversationId,
        adminSupabase,
      });
    }

    const knowledgeQuery = [
      ...trustedHistory.filter((message) => message.role === 'user').slice(-2).map((message) => message.content),
      latestMessage.content,
    ].join('\n');
    const { knowledge: documents } = await getAgentKnowledge(profile.id, adminSupabase, knowledgeQuery);
    const systemPrompt = buildAgentSystemPrompt(config, documents, effectiveRules);

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
          ...trustedHistory,
          latestMessage,
        ],
        temperature: 0.5,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json();
      throw new Error(error.error?.message || 'Groq connection failed');
    }

    const responseBody = activeConversationId
      ? groqResponse.body.pipeThrough(createAssistantPersistenceStream({
          conversationId: activeConversationId,
          adminSupabase,
          ownerId: profile.id,
          question: latestMessage.content,
          uncertaintyMessage: effectiveRules.uncertainty_message,
        }))
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
    return jsonError('Unable to process the chat request', 500);
  }
}
