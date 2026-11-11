import { randomUUID } from 'node:crypto';
import { ChatProviderError, fetchChatProvider, normalizeChatProviderError } from './chat-provider.js';
import { createGroqUsageObserver } from './groq-usage.js';

// Conservative application budgets, below Groq's published free-plan limits.
// They are shared by organization scope, never split by API key or Qlynk user.
const FREE_BUDGET = Object.freeze({ rpm: 24, rpd: 800, tpm: 6400, tpd: 160000, concurrency: 3 });
const DEFAULTS = { 'openai/gpt-oss-120b': FREE_BUDGET, 'openai/gpt-oss-20b': FREE_BUDGET };

export function getGroqBudget(model, env = process.env) {
  const overrides = env.GROQ_QUOTA_LIMITS_JSON ? JSON.parse(env.GROQ_QUOTA_LIMITS_JSON) : {};
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Invalid Groq budget configuration');
  const budget = overrides[model] || DEFAULTS[model];
  if (!budget) throw new Error('Configure a Groq budget for this model before using it');
  for (const key of ['rpm', 'rpd', 'tpm', 'tpd', 'concurrency']) {
    if (!Number.isSafeInteger(budget[key]) || budget[key] < 1 || budget[key] > (key === 'concurrency' ? 100 : 1_000_000_000)) {
      throw new Error('Invalid Groq budget configuration');
    }
  }
  return budget;
}

export function estimateGroqTokens(body) {
  // A cautious heuristic, not an exact tokenizer. Include system instructions,
  // history, tools/format overhead and the full allowed completion (reasoning
  // included). Assume no prompt-cache hit; usage reconciliation is future work.
  const input = JSON.stringify({ messages: body.messages, tools: body.tools, response_format: body.response_format });
  const output = body.max_completion_tokens ?? body.max_tokens;
  if (!Number.isSafeInteger(output) || output <= 0) throw new Error('AI output must have a token limit');
  return Math.ceil(Buffer.byteLength(input, 'utf8') / 3) + 128 + output;
}

async function rpc(client, name, args, timeoutMs = 2000) {
  const query = client.rpc(name, args);
  const result = await (typeof query.abortSignal === 'function'
    ? query.abortSignal(AbortSignal.timeout(Math.max(1, timeoutMs))) : query);
  if (result.error) throw result.error;
  return result.data;
}

export async function fetchWithGroqQuota(body, {
  client, env = process.env, background = false, workload = 'other',
  scope = env.GROQ_QUOTA_SCOPE || 'qlynk-groq',
  fetchProvider = fetchChatProvider, ...options
}) {
  const deadline = Math.min(options.deadline ?? Date.now() + 20_000, Date.now() + 30_000);
  let budget;
  let tokens;
  try {
    if (!scope || scope.length > 100) throw new Error('Invalid Groq quota scope');
    if (!['chat', 'scope', 'sentiment', 'demo', 'knowledge_graph', 'other'].includes(workload)) throw new Error('Invalid AI workload');
    budget = getGroqBudget(body.model, env);
    tokens = estimateGroqTokens(body);
  } catch (error) {
    console.error('[AI Budget] Invalid configuration:', error.message);
    throw new ChatProviderError();
  }
  const id = randomUUID();
  let admission;
  try {
    options.signal?.throwIfAborted();
    if (deadline <= Date.now()) throw new ChatProviderError('AI_TIMEOUT');
    admission = await rpc(client, 'reserve_ai_provider_budget', {
      p_scope: scope, p_model: body.model, p_request_id: id, p_tokens: tokens,
      p_rpm: budget.rpm, p_rpd: budget.rpd, p_tpm: budget.tpm, p_tpd: budget.tpd,
      p_concurrency: budget.concurrency, p_background: background,
    }, Math.min(2000, deadline - Date.now()));
    if (typeof admission?.allowed !== 'boolean') throw new Error('Invalid AI budget response');
  } catch (error) {
    // Never fall back to a per-process counter: that would bypass the global cap.
    throw normalizeChatProviderError(error);
  }
  if (!admission.allowed) {
    throw new ChatProviderError(admission.reason === 'too_large' ? 'AI_REQUEST_TOO_LARGE' : 'AI_RATE_LIMITED',
      Math.max(1, Number(admission.retry_after) || 60));
  }
  let released = false;
  const observer = createGroqUsageObserver(body.stream === true);
  const release = async () => {
    if (released) return;
    released = true;
    try {
      await rpc(client, 'complete_ai_provider_request', {
        p_request_id: id, p_workload: workload, p_usage: observer.finish(),
      });
    } catch {
      console.error('[AI Budget] Usage recording unavailable');
      try { await rpc(client, 'finish_ai_provider_request', { p_request_id: id }); }
      catch { console.error('[AI Budget] Slot release deferred to lease expiry'); }
    }
  };
  try {
    const response = await fetchProvider(body, { ...options, deadline });
    if (!response.body) throw new ChatProviderError();
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) { await release(); controller.close(); }
          else { observer.push(value); controller.enqueue(value); }
        } catch (error) { await release(); controller.error(error); }
      },
      async cancel(reason) {
        try { await reader.cancel(reason); } finally { await release(); }
      },
    });
    return new Response(stream, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    if (error instanceof ChatProviderError && error.code === 'AI_RATE_LIMITED') {
      try {
        await rpc(client, 'cooldown_ai_provider_budget', {
          p_scope: scope, p_model: body.model, p_seconds: Math.min(604800, Math.max(1, Math.ceil(error.retryAfter))),
        });
      } catch { console.error('[AI Budget] Unable to share provider cooldown'); }
    }
    await release();
    throw normalizeChatProviderError(error);
  }
}
