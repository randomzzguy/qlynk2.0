import assert from 'node:assert/strict';
import test from 'node:test';
import { createGroqUsageObserver, normalizeGroqUsage } from '../lib/groq-usage.js';
import { analyzeConversationSentiment } from '../lib/chat-sentiment.js';

const usage = { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, prompt_tokens_details: { cached_tokens: 30 } };
test('usage observation survives arbitrary byte boundaries for both Groq response formats', () => {
  for (const streaming of [false, true]) {
    const observer = createGroqUsageObserver(streaming);
    const payload = streaming ? `data: ${JSON.stringify({ choices: [], x_groq: { usage } })}\r\n\r\ndata: [DONE]\n\n`
      : JSON.stringify({ choices: [{ message: { content: '你好' } }], usage });
    for (const byte of new TextEncoder().encode(payload)) observer.push(new Uint8Array([byte]));
    assert.deepEqual(observer.finish(), { prompt_tokens: 100, completion_tokens: 20, cached_tokens: 30 });
  }
});
test('malformed or missing usage is not reported as zero consumption', () => {
  for (const value of [undefined, {}, { ...usage, prompt_tokens: -1 }, { ...usage, completion_tokens: 1.5 },
    { ...usage, total_tokens: 500 }, { ...usage, prompt_tokens_details: { cached_tokens: 101 } }]) {
    assert.equal(normalizeGroqUsage(value), null);
  }
  const observer = createGroqUsageObserver(true);
  observer.push(new TextEncoder().encode('data: {broken}\n\ndata: [DONE]\n\n'));
  assert.equal(observer.finish(), null);
});
test('oversized optional telemetry buffers are dropped safely', () => {
  const observer = createGroqUsageObserver(false);
  observer.push(new TextEncoder().encode('x'.repeat(300000)));
  observer.push(new TextEncoder().encode(JSON.stringify({ usage })));
  assert.equal(observer.finish(), null);
});

function sentimentFixture({ claimed = true, label = 'positive' } = {}) {
  const calls = []; let sent = 0; let request;
  const query = {
    select(value) { calls.push(['select', value]); return query; },
    eq(key, value) { calls.push(['eq', key, value]); return query; },
    order(key, value) { calls.push(['order', key, value]); return query; },
    limit(value) { calls.push(['limit', value]); return query; },
    then(resolve) { return Promise.resolve({ data: [{ content: 'latest'.repeat(200) }, { content: 'older' }] }).then(resolve); },
  };
  const client = {
    rpc: async (name, params) => { calls.push([name, params]); return { data: name === 'claim_agent_sentiment_check' ? claimed : true }; },
    from: () => query,
  };
  const fetchProvider = async (body, options) => {
    sent++; request = { body, options };
    return Response.json({ choices: [{ message: { content: label } }] });
  };
  return { client, fetchProvider, calls, sent: () => sent, request: () => request };
}
test('sentiment uses bounded recent visitor messages, background quota and a claim token', async () => {
  const f = sentimentFixture();
  await analyzeConversationSentiment({ ...f, conversationId: 'conversation', env: {} });
  assert.equal(f.sent(), 1);
  assert.ok(f.calls.some(c => c[0] === 'eq' && c[1] === 'role' && c[2] === 'user'));
  assert.ok(f.calls.some(c => c[0] === 'order' && c[2].ascending === false));
  assert.ok(f.calls.some(c => c[0] === 'limit' && c[1] === 6));
  const { body, options } = f.request();
  const messages = JSON.parse(body.messages[1].content);
  assert.equal(messages[0], 'older');
  assert.equal(messages[1].length, 500);
  assert.equal(options.background, true);
  assert.equal(options.workload, 'sentiment');
  const claim = f.calls.find(c => c[0] === 'claim_agent_sentiment_check')[1];
  const saved = f.calls.find(c => c[0] === 'finish_agent_sentiment_check')[1];
  assert.equal(saved.p_claim_id, claim.p_claim_id);
});
test('disabled, late or unclaimed analysis never calls the provider', async () => {
  for (const options of [{ env: { GROQ_SENTIMENT_ENABLED: '0' } }, { deadline: Date.now() - 1 }, { claimed: false }]) {
    const f = sentimentFixture(options);
    await analyzeConversationSentiment({ ...f, conversationId: 'conversation', env: {}, ...options });
    assert.equal(f.sent(), 0);
  }
});
test('invalid sentiment is not saved and a provider quota error remains optional', async () => {
  const f = sentimentFixture({ label: 'made up label' });
  await analyzeConversationSentiment({ ...f, conversationId: 'conversation', env: {} });
  assert.equal(f.calls.some(c => c[0] === 'finish_agent_sentiment_check'), false);
  await analyzeConversationSentiment({ ...f, conversationId: 'conversation', env: {}, fetchProvider: async () => {
    const error = new Error('busy'); error.code = 'AI_RATE_LIMITED'; throw error;
  } });
});
