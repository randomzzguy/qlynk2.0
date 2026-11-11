import assert from 'node:assert/strict';
import test from 'node:test';
import { createSettledChatStream, readChatEvents } from '../lib/chat-stream.js';

const frame = text => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
function body(chunks) {
  return new ReadableStream({ start(controller) {
    for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
    controller.close();
  } });
}
const collect = async stream => {
  let text = '';
  for await (const event of readChatEvents(stream)) text += event.choices?.[0]?.delta?.content || '';
  return text;
};

test('fragmented SSE frames preserve content and settle before exposing DONE', async () => {
  let saved;
  let refunds = 0;
  const data = frame('Hello ') + frame('world') + 'data: [DONE]\n\n';
  const stream = createSettledChatStream(body([...data]), {
    complete: async answer => { saved = answer; }, release: async () => { refunds++; },
  });
  assert.equal(await collect(stream), 'Hello world');
  assert.equal(saved, 'Hello world');
  assert.equal(refunds, 0);
});

test('truncated, empty, malformed and explicit provider error streams refund without settlement', async () => {
  for (const data of [frame('Partial'), 'data: [DONE]\n\n', 'data: {broken}\n', 'data: {"error":{"message":"provider error"}}\n\n']) {
    let refunds = 0;
    let saved = false;
    const stream = createSettledChatStream(body([data]), {
      complete: async () => { saved = true; }, release: async () => { refunds++; },
    });
    await assert.rejects(collect(stream), /could not be completed/);
    assert.equal(saved, false);
    assert.equal(refunds, 1);
  }
});

test('failed persistence refunds and never signals a successful completion', async () => {
  let refunds = 0;
  const stream = createSettledChatStream(body([frame('Answer'), 'data: [DONE]\n\n']), {
    complete: async () => { throw new Error('database unavailable'); }, release: async () => { refunds++; },
  });
  await assert.rejects(collect(stream), /could not be completed/);
  assert.equal(refunds, 1);
});

test('visitor cancellation releases the pending reservation', async () => {
  let refunds = 0;
  let saved = false;
  const stream = createSettledChatStream(body([frame('Partial'), frame('Answer'), 'data: [DONE]\n\n']), {
    complete: async () => { saved = true; }, release: async () => { refunds++; },
  });
  const reader = stream.getReader();
  await reader.read();
  await reader.cancel();
  assert.equal(refunds, 1);
  assert.equal(saved, false);
});

test('network read failures release the credit', async () => {
  let refunds = 0;
  const stream = createSettledChatStream(new ReadableStream({ pull(controller) { controller.error(new Error('connection reset')); } }), {
    complete: async () => assert.fail('must not settle'), release: async () => { refunds++; },
  });
  await assert.rejects(collect(stream), /could not be completed/);
  assert.equal(refunds, 1);
});
