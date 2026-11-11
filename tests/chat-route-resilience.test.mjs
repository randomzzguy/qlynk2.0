import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import swc from 'next/dist/build/swc/index.js';
import * as provider from '../lib/chat-provider.js';
import * as streams from '../lib/chat-stream.js';
import * as models from '../lib/groq-models.js';
import * as plans from '../lib/plans.js';

const { code } = swc.transformSync(readFileSync(new URL('../app/api/ai-chat/route.js', import.meta.url), 'utf8'), {
  filename: 'chat-route.js', jsc: { parser: { syntax: 'ecmascript' } }, module: { type: 'commonjs' },
});

function setup({ failAt, truncated = false, replay = false } = {}) {
  const calls = [];
  const afterCallbacks = [];
  let sentimentCalls = 0;
  const conversation = randomUUID();
  let providerCalls = 0;
  const admin = {
    from(table) {
      const data = table === 'profiles' ? { id: randomUUID() }
        : table === 'agent_configs' ? { is_enabled: true, agent_type: 'personal' }
        : table === 'subscriptions' ? { tier: 'creator', status: 'active' }
        : table === 'agent_messages' ? [] : {};
      const query = new Proxy({}, { get: (_target, prop) => prop === 'then'
        ? (resolve) => resolve({ data }) : () => query });
      return query;
    },
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: name === 'reserve_agent_chat_request'
        ? { status: replay ? 'completed' : 'reserved', conversation_id: conversation, answer: 'Saved answer', new_conversation: false }
        : true };
    },
  };
  const modules = {
    'next/server': { after: callback => afterCallbacks.push(callback) },
    '@/lib/chat-sentiment': { analyzeConversationSentiment: async () => { sentimentCalls++; } },
    '@/utils/supabase/server': { createAdminClient: () => admin },
    '@/lib/chat-stream': streams,
    '@/lib/chat-provider': provider,
    '@/lib/groq-provider': { fetchGroqWithQuota: async () => {
      providerCalls++;
      if (providerCalls === failAt) throw new provider.ChatProviderError('AI_RATE_LIMITED', 90);
      if (providerCalls === 1) return Response.json({ choices: [{ message: { content: 'ALLOW' } }] });
      return new Response('data: {"choices":[{"delta":{"content":"Answer"}}]}\n\n' + (truncated ? '' : 'data: [DONE]\n\n'));
    } },
    '@/lib/agent': { getAgentKnowledge: async () => ({ knowledge: [] }), buildAgentSystemPrompt: () => 'Prompt' },
    '@/lib/plans': plans,
    '@/lib/rate-limit': { rateLimitResponse: async () => null, rateLimitResponseForKey: async () => null },
    '@/lib/email/send': {}, '@/lib/email/templates/new-message': {}, '@/lib/email/preferences': {},
    '@/lib/agent-prompt': { buildScopeClassifierPrompt: () => 'Classify', detectDirectPolicyAttack: () => null, parseScopeDecision: () => 'ALLOW' },
    '@/lib/agent-rules': { normalizeAgentRules: () => ({ scope_mode: 'strict' }) },
    '@/lib/knowledge-gaps': { shouldRecordKnowledgeGap: () => false },
    '@/lib/widget-installations': {}, '@/lib/groq-models': models,
  };
  const compiled = { exports: {} };
  const require = createRequire(import.meta.url);
  new Function('require', 'module', 'exports', code)(name => modules[name] || require(name), compiled, compiled.exports);
  return {
    calls, conversation, providerCalls: () => providerCalls,
    runAfter: async () => { for (const callback of afterCallbacks) await callback(); },
    sentimentCalls: () => sentimentCalls,
    async run() {
      const original = process.env.GROQ_API_KEY;
      process.env.GROQ_API_KEY = 'test-key';
      try {
        return await compiled.exports.POST(new Request('https://example.test/api/ai-chat', {
          method: 'POST', body: JSON.stringify({ username: 'test-agent', visitorId: randomUUID(), requestId: randomUUID(), messages: [{ role: 'user', content: 'Hello' }] }),
        }));
      } finally {
        if (original === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = original;
      }
    },
  };
}

test('scope and answer quota failures refund and preserve the conversation for retry', async () => {
  for (const failAt of [1, 2]) {
    const fixture = setup({ failAt });
    const response = await fixture.run();
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '90');
    assert.equal(response.headers.get('x-conversation-id'), fixture.conversation);
    assert.equal(fixture.calls.filter(c => c.name === 'finish_agent_chat_request' && c.params.p_answer === null).length, 1);
    assert.equal(fixture.providerCalls(), failAt);
  }
});

test('stream settlement owns the credit after the route returns', async () => {
  const fixture = setup();
  const response = await fixture.run();
  assert.equal(response.status, 200);
  const events = [];
  for await (const event of streams.readChatEvents(response.body)) events.push(event);
  const settlements = fixture.calls.filter(c => c.name === 'finish_agent_chat_request');
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].params.p_answer, 'Answer');
  assert.equal(events.at(-1).done, true);
  assert.equal(fixture.sentimentCalls(), 0);
  await fixture.runAfter();
  assert.equal(fixture.sentimentCalls(), 1);
});

test('truncated HTTP-200 replies release their credit through the stream', async () => {
  const fixture = setup({ truncated: true });
  const response = await fixture.run();
  await assert.rejects(async () => { for await (const event of streams.readChatEvents(response.body)) void event; }, /could not be completed/);
  assert.equal(fixture.calls.filter(c => c.name === 'finish_agent_chat_request' && c.params.p_answer === null).length, 1);
  await fixture.runAfter();
  assert.equal(fixture.sentimentCalls(), 0);
});

test('completed replay returns the saved response without calling AI', async () => {
  const fixture = setup({ replay: true });
  const response = await fixture.run();
  assert.match(await response.text(), /Saved answer/);
  assert.equal(fixture.providerCalls(), 0);
  await fixture.runAfter();
  assert.equal(fixture.sentimentCalls(), 0);
});
