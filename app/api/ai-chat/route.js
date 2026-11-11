import { after } from 'next/server';
import { analyzeConversationSentiment } from '@/lib/chat-sentiment';
import { createAdminClient } from '@/utils/supabase/server';
import { createHash, randomUUID } from 'node:crypto';
import { createSettledChatStream } from '@/lib/chat-stream';
import { chatProviderErrorResponse, normalizeChatProviderError } from '@/lib/chat-provider';
import { fetchGroqWithQuota } from '@/lib/groq-provider';
import { buildAgentSystemPrompt, getAgentKnowledge } from '@/lib/agent';
import { getMessageLimit, isSubscriptionLive, getEffectiveTier } from '@/lib/plans';
import { checkRateLimitKey, rateLimitResponse, rateLimitResponseForKey } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';
import { newMessageEmail } from '@/lib/email/templates/new-message';
import { buildEmailPreferencesUrl } from '@/lib/email/preferences';
import { compare } from 'bcryptjs';
import {
  buildScopeClassifierPrompt,
  detectDirectPolicyAttack,
  getScopeRefusalMessage,
  parseScopeDecision,
} from '@/lib/agent-prompt';
import { normalizeAgentRules } from '@/lib/agent-rules';
import { normalizeKnowledgeGapQuestion, shouldRecordKnowledgeGap } from '@/lib/knowledge-gaps';
import { isOriginAllowed, isWidgetId, normalizeWidgetOrigin } from '@/lib/widget-installations';
import {
  getGroqChatModel,
  getGroqFastModel,
  getGroqGenerationOptions,
} from '@/lib/groq-models';

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

async function classifyRequestScope({ config, rules, latestMessage, trustedHistory, signal, deadline }) {
  const model = getGroqFastModel();
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
    const response = await fetchGroqWithQuota({
        model,
        messages: [{ role: 'system', content: classifierPrompt }],
        temperature: 0,
        max_completion_tokens: 32,
        ...getGroqGenerationOptions(model),
      }, {
        apiKey: process.env.GROQ_API_KEY,
        signal, workload: 'scope',
        deadline: Math.min(deadline, Date.now() + 6_000),
    });

    const data = await response.json();
    return parseScopeDecision(data.choices?.[0]?.message?.content, rules.scope_mode);
  } catch (error) {
    console.error('[AI Chat] Scope classifier unavailable:', error.message);
    throw normalizeChatProviderError(error);
  }
}

async function createStaticAssistantResponse({ content, conversationId, complete }) {
  if (complete) await complete(content);
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
    requestId,
    username,
    visitorId,
    conversationId,
    visitorName,
    visitorEmail,
    accessPassword,
    widgetId,
    sourceOrigin,
  } = body || {};

  if (requestId != null && (typeof requestId !== 'string' || !UUID_PATTERN.test(requestId))) {
    return { error: 'Invalid request identifier', status: 400 };
  }

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

  if (widgetId != null && !isWidgetId(widgetId)) {
    return { error: 'Invalid widget identifier', status: 400 };
  }

  const normalizedSourceOrigin = sourceOrigin == null ? null : normalizeWidgetOrigin(sourceOrigin);
  if (sourceOrigin != null && !normalizedSourceOrigin) {
    return { error: 'Invalid widget source origin', status: 400 };
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
      // Older open clients remain supported, but only clients sending a stable
      // request ID can replay a request without consuming another credit.
      requestId: requestId || randomUUID(),
      username,
      visitorId,
      conversationId: conversationId || null,
      visitorName: typeof visitorName === 'string' ? visitorName.trim().slice(0, 100) : '',
      visitorEmail: typeof visitorEmail === 'string' ? visitorEmail.trim().slice(0, 254) : '',
      accessPassword: typeof accessPassword === 'string' ? accessPassword.slice(0, 200) : '',
      widgetId: widgetId || null,
      sourceOrigin: normalizedSourceOrigin,
      latestMessage,
    },
  };
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function recordCompletedReply({ answer, conversationId, adminSupabase, ownerId, question, uncertaintyMessage, deadline }) {
  if (deadline - Date.now() < 1500) return;
  if (ownerId && shouldRecordKnowledgeGap(answer, uncertaintyMessage)) {
    const normalizedQuestion = normalizeKnowledgeGapQuestion(question);
    if (normalizedQuestion) {
      const query = adminSupabase.rpc('record_agent_knowledge_gap', {
        p_owner_id: ownerId,
        p_question: String(question || '').slice(0, 1000),
        p_normalized_question: normalizedQuestion,
        p_conversation_id: conversationId,
      });
      const { error } = await (typeof query.abortSignal === 'function'
        ? query.abortSignal(AbortSignal.timeout(1500)) : query);
      if (error) console.error('[AI Chat] Failed to record knowledge gap:', error.message);
    }
  }
  await analyzeConversationSentiment({ conversationId, client: adminSupabase, fetchProvider: fetchGroqWithQuota, deadline });
}

export async function POST(req) {
  let reservation = null;
  let activeConversationId = null;
  let streamOwnsReservation = false;
  const release = async () => {
    if (!reservation) return;
    try {
      const { error } = await reservation.client.rpc('finish_agent_chat_request', {
        ...reservation.params, p_answer: null,
      });
      if (error) console.error('[AI Chat] Credit release deferred to lease recovery:', error.message);
    } catch (error) {
      console.error('[AI Chat] Credit release deferred to lease recovery:', error.message);
    }
  };
  const complete = async (answer) => {
    const { data, error } = await reservation.client.rpc('finish_agent_chat_request', {
      ...reservation.params, p_answer: answer,
    });
    if (error || data !== true) throw new Error('Unable to save the completed reply');
  };
  // Leave time for persistence and a useful response before the platform's 30s limit.
  const providerDeadline = Date.now() + 25_000;
  // Rate limit: 20 requests per minute per IP
  const rateLimit = await rateLimitResponse(req, 'ai-chat', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const parsedRequest = await parseChatRequest(req);
    if (parsedRequest.error) {
      return jsonError(parsedRequest.error, parsedRequest.status);
    }

    const {
      requestId,
      username,
      visitorId,
      conversationId,
      visitorName,
      visitorEmail,
      accessPassword,
      widgetId,
      sourceOrigin,
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

    const tier = getEffectiveTier(subscription);

    if (!isSubscriptionLive(subscription)) {
      return jsonError('Agent is not active on the current plan', 403);
    }

    let widgetContext = null;
    if (widgetId) {
      const { data: installation, error: widgetError } = await adminSupabase
        .from('widget_installations')
        .select('id, owner_id, is_enabled, allowed_origins, pre_chat_enabled, pre_chat_email_enabled, pre_chat_email_required')
        .eq('id', widgetId)
        .maybeSingle();
      if (widgetError || !installation?.is_enabled || installation.owner_id !== profile.id) {
        return jsonError('Website widget is not available', 403);
      }
      if (!sourceOrigin || !isOriginAllowed(sourceOrigin, installation.allowed_origins)) {
        return jsonError('This website is not allowed to use the widget', 403);
      }
      widgetContext = installation;
    }

    const messageLimit = getMessageLimit(tier);

    const accessLevel = config.access_level || 'public';

    if (visitorEmail && !isValidEmail(visitorEmail)) {
      return jsonError('Please enter a valid email or leave it blank', 400);
    }
    if (widgetContext?.pre_chat_enabled && !visitorName) {
      return jsonError('Your name is required to start this chat', 400);
    }
    if (widgetContext?.pre_chat_enabled &&
        widgetContext.pre_chat_email_enabled &&
        widgetContext.pre_chat_email_required &&
        !visitorEmail) {
      return jsonError('Your email is required to start this chat', 400);
    }

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

    if (accessLevel === 'email' && !visitorEmail) {
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
    activeConversationId = conversationId;
    let trustedHistory = [];

    if (activeConversationId) {
      const { data: existingConversation, error: conversationError } = await adminSupabase
        .from('agent_conversations')
        .select('id, agent_owner_id, visitor_id, channel, widget_installation_id')
        .eq('id', activeConversationId)
        .maybeSingle();

      if (conversationError || !existingConversation) {
        return jsonError('Conversation not found', 404);
      }

      if (existingConversation.agent_owner_id !== profile.id ||
          existingConversation.visitor_id !== visitorId) {
        return jsonError('Conversation does not belong to this visitor and agent', 403);
      }
      const expectedChannel = widgetContext ? 'widget' : 'hosted';
      if (existingConversation.channel !== expectedChannel ||
          (widgetContext && existingConversation.widget_installation_id !== widgetContext.id)) {
        return jsonError('Conversation does not belong to this chat channel', 403);
      }

    }

    const attemptId = randomUUID();
    reservation = { client: adminSupabase, params: {
      p_owner_id: profile.id, p_request_id: requestId, p_attempt_id: attemptId,
    } };
    const { data: credit, error: creditError } = await adminSupabase.rpc('reserve_agent_chat_request', {
      p_owner_id: profile.id,
      p_request_id: requestId,
      p_attempt_id: attemptId,
      p_visitor_id: visitorId,
      p_fingerprint: hashSecurityIdentifier(JSON.stringify([latestMessage.content, visitorId, widgetId, sourceOrigin, visitorName, visitorEmail])),
      p_question: latestMessage.content,
      p_message_limit: messageLimit,
      p_conversation_id: activeConversationId,
      p_context: {
        visitor_name: visitorName || null, visitor_email: visitorEmail || null,
        channel: widgetContext ? 'widget' : 'hosted',
        widget_installation_id: widgetContext?.id || null,
        source_origin: widgetContext ? sourceOrigin : null,
      },
    });
    if (creditError || !credit) {
      console.error('[AI Chat] Unable to reserve message credit:', creditError?.message || 'No result');
      return jsonError('Unable to verify agent usage right now', 503);
    }
    if (credit.status === 'limit') {
      return jsonError('This agent has reached its monthly message limit', 429);
    }
    if (credit.status === 'conflict') return jsonError('This request identifier belongs to a different message', 409);
    if (credit.conversation_id) activeConversationId = credit.conversation_id;
    if (credit.status === 'pending') {
      return Response.json({ error: 'This message is still being processed. Please wait before retrying.' }, {
        status: 409, headers: { 'Retry-After': '5', 'x-conversation-id': activeConversationId },
      });
    }
    if (credit.status === 'completed') {
      if (!credit.answer) return jsonError('This reply is no longer available', 409);
      return createStaticAssistantResponse({ content: credit.answer, conversationId: activeConversationId });
    }
    if (credit.status !== 'reserved') return jsonError('Unable to verify agent usage right now', 503);

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

    if (credit.new_conversation) {
      const newConv = { id: activeConversationId };

      // Notify the agent owner of the new conversation (fire-and-forget)
      if (newConv?.id) {
        const [{ data: ownerAuthUser }, { data: ownerProfile, error: ownerProfileError }] = await Promise.all([
          adminSupabase.auth.admin.getUserById(profile.id),
          adminSupabase.from('profiles').select('notif_new_message').eq('id', profile.id).maybeSingle(),
        ]);
        if (ownerProfileError) {
          console.error('[AI Chat] Failed to read notification preference:', ownerProfileError.message);
        }
        const ownerEmail = ownerAuthUser?.user?.email;
        const ownerNotifEnabled = !ownerProfileError && ownerProfile?.notif_new_message !== false;
        if (ownerEmail && ownerNotifEnabled) {
          sendEmail({
            to: ownerEmail,
            ...newMessageEmail({
              visitorName: visitorName || null,
              visitorEmail: visitorEmail || null,
              messagePreview: latestMessage.content,
              conversationsUrl: `https://qlynk.site/dashboard/conversations`,
              preferencesUrl: buildEmailPreferencesUrl(profile.id, 'new_message'),
            }),
            idempotencyKey: `new-conversation-${newConv.id}`,
          }).then((result) => {
            if (!result.success) {
              console.error('[AI Chat] New message email failed:', result.error || 'unknown email error');
              return;
            }
            return adminSupabase
              .from('agent_conversations')
              .update({ email_notified: true })
              .eq('id', newConv.id);
          }).catch((err) => console.error('[AI Chat] New message email failed:', err));
        }
      }
    }

    const scopeDecision = detectDirectPolicyAttack(latestMessage.content)
      || await classifyRequestScope({
        config,
        rules: effectiveRules,
        latestMessage,
        trustedHistory,
        signal: req.signal,
        deadline: providerDeadline,
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

      return await createStaticAssistantResponse({
        content: blockLimit.allowed
          ? getScopeRefusalMessage(effectiveRules, scopeDecision)
          : 'This visitor has made too many blocked requests. Please wait before trying again or contact the agent owner.',
        conversationId: activeConversationId,
        complete,
      });
    }

    const knowledgeQuery = [
      ...trustedHistory.filter((message) => message.role === 'user').slice(-2).map((message) => message.content),
      latestMessage.content,
    ].join('\n');
    const { knowledge: documents } = await getAgentKnowledge(profile.id, adminSupabase, knowledgeQuery);
    const systemPrompt = buildAgentSystemPrompt(config, documents, effectiveRules);
    const model = getGroqChatModel();

    // TALK DIRECTLY TO GROQ
    const groqResponse = await fetchGroqWithQuota({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...trustedHistory,
          latestMessage,
        ],
        temperature: 0.5,
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        ...getGroqGenerationOptions(model),
        stream: true,
      }, {
        apiKey: process.env.GROQ_API_KEY,
        signal: req.signal, workload: 'chat',
        deadline: providerDeadline,
    });

    let completedAnswer = null;
    const responseBody = createSettledChatStream(groqResponse.body, {
      complete: async (answer) => {
        await complete(answer);
        completedAnswer = answer;
      },
      release,
    });
    after(async () => {
      if (!completedAnswer) return;
      try {
        await recordCompletedReply({
          answer: completedAnswer, conversationId: activeConversationId, adminSupabase,
          ownerId: profile.id, question: latestMessage.content,
          uncertaintyMessage: effectiveRules.uncertainty_message,
          deadline: providerDeadline + 4000,
        });
      } catch { console.error('[AI Chat] Background analysis unavailable'); }
    });
    streamOwnsReservation = true;

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
    const providerError = chatProviderErrorResponse(error);
    if (providerError) {
      console.error('[AI Chat] Provider unavailable:', error.code, 'retry after', error.retryAfter);
      if (activeConversationId) providerError.headers.set('x-conversation-id', activeConversationId);
      return providerError;
    }
    console.error('[Library-Free-Chat] Error:', error);
    const response = jsonError('Unable to process the chat request', 500);
    if (activeConversationId) response.headers.set('x-conversation-id', activeConversationId);
    return response;
  } finally {
    if (!streamOwnsReservation) await release();
  }
}
