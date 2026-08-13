import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const edgeFunction = await readFile(new URL('../supabase/functions/knowledge-embeddings/index.ts', import.meta.url), 'utf8');
const embeddingClient = await readFile(new URL('../lib/knowledge-embeddings.js', import.meta.url), 'utf8');
const cronRoute = await readFile(new URL('../app/api/cron/knowledge-embeddings/route.js', import.meta.url), 'utf8');

test('embedding inference is service-only, bounded, normalized, and model-versioned', () => {
  assert.match(edgeFunction, /KNOWLEDGE_EMBEDDINGS_SECRET/);
  assert.match(edgeFunction, /apiKey !== embeddingSecret/);
  assert.doesNotMatch(embeddingClient, /Authorization:/);
  assert.match(embeddingClient, /apikey: embeddingSecret/);
  assert.match(edgeFunction, /MAX_INPUTS = 16/);
  assert.match(edgeFunction, /MAX_INPUT_CHARS = 4_000/);
  assert.match(edgeFunction, /mean_pool: true, normalize: true/);
  assert.match(edgeFunction, /gte-small@1/);
  assert.match(edgeFunction, /MODEL_DIMENSIONS = 384/);
});

test('semantic retrieval is feature-gated and retains lexical fallback behavior', () => {
  assert.match(embeddingClient, /KNOWLEDGE_EMBEDDINGS_ENABLED === '1'/);
  assert.match(embeddingClient, /hybrid_search_agent_knowledge_chunks/);
  assert.match(embeddingClient, /fail_agent_knowledge_embedding_jobs/);
  assert.match(embeddingClient, /AbortSignal\.timeout/);
  assert.match(embeddingClient, /knowledge: null/);
});

test('embedding backfill route uses existing cron authentication and bounded batches', () => {
  assert.match(cronRoute, /authorizeCronRequest/);
  assert.match(cronRoute, /batch < 4/);
  assert.match(cronRoute, /limit: 16/);
});
