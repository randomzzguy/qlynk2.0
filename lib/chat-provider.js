// Provider errors are deliberately separate from visitor policy decisions.
export class ChatProviderError extends Error {
  constructor(code = 'AI_UNAVAILABLE', retryAfter = 30) {
    super(code);
    this.name = 'ChatProviderError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function parseRetryAfter(value, now = Date.now()) {
  if (!value?.trim()) return 60;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds)
    ? seconds
    : (Date.parse(value) - now) / 1000;
  return Number.isFinite(delay) && delay >= 0 ? Math.max(1, Math.ceil(delay)) : 60;
}

export function chatProviderErrorResponse(error) {
  if (!(error instanceof ChatProviderError)) return null;
  const limited = error.code === 'AI_RATE_LIMITED';
  const tooLarge = error.code === 'AI_REQUEST_TOO_LARGE';
  const message = tooLarge
    ? 'This conversation needs more AI capacity than is currently available. Try a shorter question in a new chat or contact the agent owner.'
    : limited
    ? `The AI service is busy. Please try again in ${error.retryAfter} seconds.`
    : 'The AI service is temporarily unavailable. Please try again shortly.';
  return Response.json({ error: message, code: error.code, retryAfter: error.retryAfter }, {
    status: tooLarge ? 413 : limited ? 429 : 503,
    headers: { ...(!tooLarge && { 'Retry-After': String(error.retryAfter) }), 'Cache-Control': 'no-store' },
  });
}

export function normalizeChatProviderError(error) {
  if (error instanceof ChatProviderError) return error;
  return new ChatProviderError(
    error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_UNAVAILABLE',
  );
}

// Do not automatically replay POSTs: they can consume quota even when the
// response is lost. Keep the abort signal attached while a stream is consumed.
export async function fetchChatProvider(body, {
  apiKey,
  signal,
  deadline = Date.now() + 20_000,
  fetchImpl = fetch,
} = {}) {
  const remaining = Math.floor(deadline - Date.now());
  if (remaining <= 0) throw new ChatProviderError('AI_TIMEOUT');
  const timeout = AbortSignal.timeout(remaining);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    requestSignal.throwIfAborted();
    const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: requestSignal,
      cache: 'no-store',
    });
    if (!response.ok) {
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      // Never expose provider response bodies (which may contain account details).
      await response.body?.cancel();
      throw new ChatProviderError(response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UNAVAILABLE', retryAfter);
    }
    if (!response.body) throw new ChatProviderError();
    return response;
  } catch (error) {
    throw normalizeChatProviderError(error);
  }
}
