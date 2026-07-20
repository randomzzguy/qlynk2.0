import { buildNorthstarDemoPrompt } from './demo/northstar.js';

export const DEMO_CHAT_LIMITS = Object.freeze({
  maxRequestChars: 4_000,
  maxQuestions: 3,
  maxQuestionChars: 500,
  maxTotalQuestionChars: 1_200,
  maxOutputTokens: 260,
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNSAFE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function parseDemoChatBody(rawBody) {
  if (typeof rawBody !== 'string' || rawBody.length > DEMO_CHAT_LIMITS.maxRequestChars) {
    return { error: 'Request body is too large', status: 413 };
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { error: 'Invalid JSON body', status: 400 };
  }

  const { questions, sessionId } = body || {};
  if (typeof sessionId !== 'string' || !UUID_PATTERN.test(sessionId)) {
    return { error: 'Invalid demo session', status: 400 };
  }

  if (!Array.isArray(questions) || questions.length === 0 || questions.length > DEMO_CHAT_LIMITS.maxQuestions) {
    return { error: `The demo accepts between 1 and ${DEMO_CHAT_LIMITS.maxQuestions} questions`, status: 400 };
  }

  let totalChars = 0;
  const sanitizedQuestions = [];
  for (const question of questions) {
    if (typeof question !== 'string') {
      return { error: 'Every demo question must be text', status: 400 };
    }

    const content = question.replace(UNSAFE_CONTROL_CHARS, '').trim();
    if (!content || content.length > DEMO_CHAT_LIMITS.maxQuestionChars) {
      return { error: `Each question must contain 1-${DEMO_CHAT_LIMITS.maxQuestionChars} characters`, status: 400 };
    }

    totalChars += content.length;
    if (totalChars > DEMO_CHAT_LIMITS.maxTotalQuestionChars) {
      return { error: 'Demo question history is too large', status: 413 };
    }
    sanitizedQuestions.push(content);
  }

  return { value: { questions: sanitizedQuestions, sessionId } };
}

export function buildNorthstarDemoMessages(questions) {
  const questionHistory = questions
    .map((question, index) => `Question ${index + 1}: ${question}`)
    .join('\n');

  return [
    { role: 'system', content: buildNorthstarDemoPrompt() },
    {
      role: 'user',
      content: `Answer the latest question. Earlier questions are included only as conversational context.\n\n${questionHistory}`,
    },
  ];
}
