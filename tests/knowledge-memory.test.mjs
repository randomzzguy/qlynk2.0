import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAgentSystemPrompt } from '../lib/agent-prompt.js';
import { validateExplicitMemoryInput } from '../lib/knowledge-memory-input.js';

test('temporal migration separates observations, preferences, patterns, and their supports', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260814040000_add_temporal_memory_and_patterns.sql', import.meta.url), 'utf8');

  for (const table of [
    'agent_memory_observations',
    'agent_memory_patterns',
    'agent_memory_pattern_support',
    'agent_memory_preferences',
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`));
  }
  assert.match(migration, /pattern_type IN \('recurrence', 'preference', 'change', 'intent_cluster'\)/);
  assert.match(migration, /consent_basis IN \('owner_explicit', 'approved_source', 'aggregate_anonymous'\)/);
  assert.match(migration, /support_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /expires_at TIMESTAMPTZ/);
  assert.match(migration, /evidence_status TEXT NOT NULL DEFAULT 'draft'/);
});

test('temporal inference requires repeated dated support and deactivates weak or expired patterns', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260814040000_add_temporal_memory_and_patterns.sql', import.meta.url), 'utf8');

  assert.match(migration, /HAVING count\(\*\) >= CASE WHEN observations\.observation_type = 'preference_signal' THEN 2 ELSE 3 END/);
  assert.match(migration, /count\(DISTINCT observations\.occurred_at::date\) >= 2/);
  assert.match(migration, /evidence_status = 'unresolved'[\s\S]+expires_at IS NOT NULL AND expires_at <= now\(\)/);
  assert.match(migration, /current_support\.support_count < CASE WHEN patterns\.pattern_type = 'recurrence' THEN 3 ELSE 2 END/);
  assert.match(migration, /selected_pattern\.support_count < minimum_support/);
});

test('visitor intent clustering remains aggregate-only and excluded from temporal chat retrieval', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260814040000_add_temporal_memory_and_patterns.sql', import.meta.url), 'utf8');

  assert.match(migration, /'intent_cluster'/);
  assert.match(migration, /'aggregate_anonymous'/);
  assert.match(migration, /patterns\.pattern_type <> 'intent_cluster'/);
  assert.doesNotMatch(migration, /agent_conversations/);
  assert.doesNotMatch(migration, /agent_messages/);
  assert.match(migration, /p_intent_similarity := greatest\(0\.7, least\(coalesce\(p_intent_similarity, 0\.82\), 0\.95\)\)/);
});

test('memory processing is feature-gated and reuses bounded versioned embeddings', async () => {
  const memory = await readFile(new URL('../lib/knowledge-memory.js', import.meta.url), 'utf8');
  const cron = await readFile(new URL('../app/api/cron/knowledge-memory/route.js', import.meta.url), 'utf8');

  assert.match(memory, /KNOWLEDGE_MEMORY_ENABLED === '1'/);
  assert.match(memory, /isKnowledgeEmbeddingsEnabled\(\)/);
  assert.match(memory, /KNOWLEDGE_EMBEDDING_MODEL/);
  assert.match(memory, /MAX_INTENT_JOBS = 16/);
  assert.match(memory, /p_intent_similarity: 0\.82/);
  assert.match(cron, /authorizeCronRequest/);
  assert.match(cron, /limit: 16/);
});

test('memory owner API reauthenticates, checks ownership and consent, and returns minimal DTOs', async () => {
  const route = await readFile(new URL('../app/api/agent/memory/route.js', import.meta.url), 'utf8');

  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /\.eq\('user_id', user\.id\)/);
  assert.match(route, /payload\.consentConfirmed !== true/);
  assert.match(route, /MAX_MEMORY_BYTES = 8_000/);
  assert.match(route, /ITEM_SELECTS/);
  assert.doesNotMatch(route, /\.select\('\*'\)/);
  assert.match(route, /support_evidence/);
  assert.doesNotMatch(route, /visitor_email|visitor_name|visitor_id/);
});

test('explicit temporal memory rejects sensitive credentials and identity data', async () => {
  assert.deepEqual(validateExplicitMemoryInput('delivery_day', 'Tuesday'), {
    key: 'delivery_day',
    value: 'Tuesday',
  });
  assert.match(validateExplicitMemoryInput('API key', 'example-value').error, /cannot store credentials/i);
  assert.match(validateExplicitMemoryInput('notes', 'Passport number: example-value').error, /identity documents/i);

  const migration = await readFile(new URL('../supabase/migrations/20260814040000_add_temporal_memory_and_patterns.sql', import.meta.url), 'utf8');
  assert.match(migration, /Sensitive data cannot be stored in memory/g);
});

test('temporal prompt context preserves time, support, confidence, expiry, and inference boundaries', () => {
  const prompt = buildAgentSystemPrompt({ agent_type: 'business' }, [{
    title: 'Recurring observation: Tuesday delivery',
    content: 'Observed 3 times across 3 dates. Latest recorded value: delivery on Tuesdays.',
    source_type: 'temporal_memory',
    source_title: 'Owner-approved temporal memory for Qlynk Studio',
    evidence_status: 'verified',
    knowledge_kind: 'temporal_memory',
    temporal_kind: 'pattern',
    temporal_entity: 'Qlynk Studio',
    occurred_at: '2026-07-15T09:00:00Z',
    expires_at: '2027-01-01T00:00:00Z',
    support_count: 3,
    confidence: 0.75,
    consent_basis: 'owner_explicit',
  }]);

  assert.match(prompt, /"knowledge_kind":"temporal_memory"/);
  assert.match(prompt, /"support_count":3/);
  assert.match(prompt, /"confidence":0\.75/);
  assert.match(prompt, /Describe a pattern as a tendency, not a certainty/i);
  assert.match(prompt, /do not turn an observation into a permanent preference/i);
  assert.match(prompt, /aggregate visitor intent clusters as personal information/i);
});

test('temporal evaluation dataset covers connections, changes, recurrence, consent, expiry, and privacy', async () => {
  const dataset = JSON.parse(await readFile(new URL('./fixtures/knowledge-memory-evaluation.json', import.meta.url), 'utf8'));
  const ids = new Set(dataset.map((item) => item.id));

  assert.equal(dataset.length, 8);
  for (const requiredId of [
    'multi_source_relationship',
    'change_over_time',
    'supported_recurrence',
    'observation_not_preference',
    'explicit_preference',
    'withdrawn_preference',
    'expired_pattern',
    'aggregate_intent_privacy',
  ]) {
    assert.ok(ids.has(requiredId), `Missing temporal evaluation case ${requiredId}`);
  }
  assert.ok(dataset.every((item) => item.question && item.required_context?.length && item.expected_behavior));
});
