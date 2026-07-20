import { detectDirectPolicyAttack } from '@/lib/agent-prompt';
import {
  buildNorthstarDemoMessages,
  DEMO_CHAT_LIMITS,
  parseDemoChatBody,
} from '@/lib/demo-chat';
import { rateLimitResponse, rateLimitResponseForKey } from '@/lib/rate-limit';

export const maxDuration = 20;

const DEMO_IP_REQUESTS_PER_MINUTE = 5;
const DEMO_IP_REQUESTS_PER_DAY = 15;
const DEMO_SESSION_REQUESTS_PER_DAY = 3;
const PROVIDER_TIMEOUT_MS = 12_000;

function jsonError(error, status) {
  return Response.json({ error }, { status });
}

function createStaticDemoStream(content) {
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
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(request) {
  const ipMinuteLimit = await rateLimitResponse(
    request,
    'demo-chat-ip-minute',
    DEMO_IP_REQUESTS_PER_MINUTE,
    60 * 1000,
  );
  if (ipMinuteLimit) return ipMinuteLimit;

  const ipDailyLimit = await rateLimitResponse(
    request,
    'demo-chat-ip-day',
    DEMO_IP_REQUESTS_PER_DAY,
    24 * 60 * 60 * 1000,
  );
  if (ipDailyLimit) return ipDailyLimit;

  const rawBody = await request.text();
  const parsed = parseDemoChatBody(rawBody);
  if (parsed.error) return jsonError(parsed.error, parsed.status);

  const { questions, sessionId } = parsed.value;
  const sessionLimit = await rateLimitResponseForKey(
    sessionId,
    'demo-chat-session-day',
    DEMO_SESSION_REQUESTS_PER_DAY,
    24 * 60 * 60 * 1000,
  );
  if (sessionLimit) return sessionLimit;

  const latestQuestion = questions[questions.length - 1];
  if (detectDirectPolicyAttack(latestQuestion)) {
    return createStaticDemoStream(
      'I can only demonstrate how Northstar Studio answers questions about its services, timelines, pricing, and process. Try asking which service fits a product launch.',
    );
  }

  const groqApiKey = process.env.GROQ_DEMO_API_KEY || process.env.GROQ_API_KEY;
  if (!groqApiKey) return jsonError('The live demo is temporarily unavailable', 503);

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_DEMO_MODEL || 'llama-3.3-70b-versatile',
        messages: buildNorthstarDemoMessages(questions),
        temperature: 0.35,
        max_completion_tokens: DEMO_CHAT_LIMITS.maxOutputTokens,
        stream: true,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)]),
    });

    if (!groqResponse.ok || !groqResponse.body) {
      console.error('[Demo Chat] Provider returned:', groqResponse.status);
      return createStaticDemoStream(
        'The live demo is taking a short break. Northstar Studio offers a Launch Package, Strategy Sprint, and Brand Refresh. You can still create your own Qlynk agent and try it with your information.',
      );
    }

    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Demo Chat] Provider unavailable:', error.message);
    return createStaticDemoStream(
      'The live demo is taking a short break. Northstar Studio offers a Launch Package, Strategy Sprint, and Brand Refresh. You can still create your own Qlynk agent and try it with your information.',
    );
  }
}
