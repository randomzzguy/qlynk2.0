import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import {
  ChatProviderError,
  chatProviderErrorResponse,
  fetchChatProvider,
  normalizeChatProviderError,
  parseRetryAfter,
} from '../lib/chat-provider.js';

test('retry timing accepts seconds and dates without shortening the provider cooldown', () => {
  assert.equal(parseRetryAfter('1.2'), 2);
  assert.equal(parseRetryAfter('86400'), 86400);
  assert.equal(parseRetryAfter('Wed, 11 Nov 2026 00:02:00 GMT', Date.parse('2026-11-11T00:00:00Z')), 120);
  for (const invalid of [null, '', '-5', 'invalid']) assert.equal(parseRetryAfter(invalid), 60);
});

test('quota exhaustion returns a safe 429 and is never automatically replayed', async () => {
  let calls = 0;
  let error;
  try {
    await fetchChatProvider({ stream: true }, {
      apiKey: 'test-key',
      fetchImpl: async () => {
        calls++;
        return new Response('private provider account details', { status: 429, headers: { 'retry-after': '120' } });
      },
    });
  } catch (caught) { error = caught; }
  assert.equal(calls, 1);
  const response = chatProviderErrorResponse(error);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '120');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const payload = await response.json();
  assert.equal(payload.code, 'AI_RATE_LIMITED');
  assert.match(payload.error, /120 seconds/);
  assert.doesNotMatch(payload.error, /private provider/);
});

test('authentication failures, retired models and outages become safe availability responses', async () => {
  for (const status of [401, 404, 500, 503]) {
    await assert.rejects(fetchChatProvider({}, {
      fetchImpl: async () => new Response('secret details', { status }),
    }), asyncError => {
      assert.equal(chatProviderErrorResponse(asyncError).status, 503);
      assert.equal(asyncError.code, 'AI_UNAVAILABLE');
      return true;
    });
  }
  assert.equal(chatProviderErrorResponse(new Error('unrelated database failure')), null);
});

test('an expired deadline or disconnected visitor never starts a provider request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response('unexpected'); };
  await assert.rejects(fetchChatProvider({}, { deadline: Date.now() - 1, fetchImpl }), { code: 'AI_TIMEOUT' });
  await assert.rejects(fetchChatProvider({}, { signal: AbortSignal.abort(), fetchImpl }), { code: 'AI_TIMEOUT' });
  assert.equal(calls, 0);
});

test('slow requests are aborted within the caller deadline', async () => {
  await assert.rejects(fetchChatProvider({}, {
    deadline: Date.now() + 20,
    fetchImpl: async (_url, { signal }) => {
      await delay(500, undefined, { signal });
      return new Response('late');
    },
  }), { code: 'AI_TIMEOUT' });
});

test('successful streams are returned untouched and retain cancellation after headers', async () => {
  const controller = new AbortController();
  const upstream = new Response('data: [DONE]\n\n');
  let upstreamSignal;
  const response = await fetchChatProvider({ model: 'test', stream: true }, {
    apiKey: 'test-key', signal: controller.signal,
    fetchImpl: async (_url, options) => {
      upstreamSignal = options.signal;
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      assert.equal(JSON.parse(options.body).stream, true);
      return upstream;
    },
  });
  assert.equal(response, upstream);
  controller.abort();
  assert.equal(upstreamSignal.aborted, true);
});

test('network errors and interrupted classifier JSON reads normalize consistently', async () => {
  await assert.rejects(fetchChatProvider({}, {
    fetchImpl: async () => { throw new TypeError('fetch failed with private detail'); },
  }), { code: 'AI_UNAVAILABLE' });
  assert.equal(normalizeChatProviderError(new DOMException('timeout', 'TimeoutError')).code, 'AI_TIMEOUT');
  const quota = new ChatProviderError('AI_RATE_LIMITED', 180);
  assert.equal(normalizeChatProviderError(quota), quota);
});
