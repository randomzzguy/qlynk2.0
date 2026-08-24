import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DEFAULT_GROQ_CHAT_MODEL,
  DEFAULT_GROQ_FAST_MODEL,
  getGroqChatModel,
  getGroqDemoModel,
  getGroqFastModel,
  getGroqGenerationOptions,
  getGroqKnowledgeGraphModel,
} from '../lib/groq-models.js';

test('uses production GPT-OSS defaults for chat and fast background work', () => {
  assert.equal(DEFAULT_GROQ_CHAT_MODEL, 'openai/gpt-oss-120b');
  assert.equal(DEFAULT_GROQ_FAST_MODEL, 'openai/gpt-oss-20b');
  assert.equal(getGroqChatModel(), DEFAULT_GROQ_CHAT_MODEL);
  assert.equal(getGroqFastModel(), DEFAULT_GROQ_FAST_MODEL);
  assert.equal(getGroqDemoModel(), DEFAULT_GROQ_CHAT_MODEL);
  assert.equal(getGroqKnowledgeGraphModel(), DEFAULT_GROQ_FAST_MODEL);
});

test('uses the reasoning controls supported by each recommended replacement', () => {
  assert.deepEqual(getGroqGenerationOptions('openai/gpt-oss-120b'), {
    reasoning_effort: 'low',
    reasoning_format: 'hidden',
  });
  assert.deepEqual(getGroqGenerationOptions('qwen/qwen3.6-27b'), {
    reasoning_effort: 'none',
    reasoning_format: 'hidden',
  });
  assert.deepEqual(getGroqGenerationOptions('provider/other-model'), {});
});

test('supports deployment-time model overrides without changing application code', () => {
  const original = {
    chat: process.env.GROQ_CHAT_MODEL,
    fast: process.env.GROQ_FAST_MODEL,
    demo: process.env.GROQ_DEMO_MODEL,
    graph: process.env.GROQ_KNOWLEDGE_GRAPH_MODEL,
  };

  try {
    process.env.GROQ_CHAT_MODEL = 'provider/chat-model';
    process.env.GROQ_FAST_MODEL = 'provider/fast-model';
    process.env.GROQ_DEMO_MODEL = 'provider/demo-model';
    process.env.GROQ_KNOWLEDGE_GRAPH_MODEL = 'provider/graph-model';

    assert.equal(getGroqChatModel(), 'provider/chat-model');
    assert.equal(getGroqFastModel(), 'provider/fast-model');
    assert.equal(getGroqDemoModel(), 'provider/demo-model');
    assert.equal(getGroqKnowledgeGraphModel(), 'provider/graph-model');
  } finally {
    for (const [name, value] of Object.entries({
      GROQ_CHAT_MODEL: original.chat,
      GROQ_FAST_MODEL: original.fast,
      GROQ_DEMO_MODEL: original.demo,
      GROQ_KNOWLEDGE_GRAPH_MODEL: original.graph,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('no runtime Groq request contains the retired Llama model IDs', async () => {
  const sources = await Promise.all([
    readFile(new URL('../app/api/ai-chat/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/demo-chat/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../lib/knowledge-graph.js', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/verify-production-integrations.mjs', import.meta.url), 'utf8'),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /llama-3\.3-70b-versatile|llama-3\.1-8b-instant/);
  }
});
