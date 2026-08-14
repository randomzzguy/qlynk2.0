import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateKnowledgeGraphExtraction } from '../lib/knowledge-graph-payload.js';
import { buildAgentSystemPrompt } from '../lib/agent-prompt.js';

const source = 'Qlynk Studio, also known as QS, offers Strategy Sprint. Strategy Sprint costs $500.';

test('graph extraction validation keeps only bounded source-grounded entities and atomic claims', () => {
  const payload = validateKnowledgeGraphExtraction({
    entities: [
      { id: 'studio', name: 'Qlynk Studio', type: 'organization', aliases: ['QS'], confidence: 0.95 },
      { id: 'sprint', name: 'Strategy Sprint', type: 'service', aliases: [], confidence: 0.9 },
    ],
    claims: [{
      subject_id: 'studio',
      predicate: 'offers',
      object_entity_id: 'sprint',
      object_value: '',
      statement: 'Qlynk Studio offers Strategy Sprint.',
      excerpt: 'offers Strategy Sprint',
      confidence: 0.93,
    }],
  }, source);

  assert.equal(payload.entities.length, 2);
  assert.deepEqual(payload.entities[0].aliases, ['QS']);
  assert.equal(payload.claims[0].predicate, 'offers');
  assert.equal(payload.claims[0].object_entity_id, 'sprint');
});
test('graph extraction rejects hallucinated evidence and malformed relationships', () => {
  assert.throws(() => validateKnowledgeGraphExtraction({
    entities: [{ id: 'studio', name: 'Imaginary Company', type: 'organization' }],
    claims: [],
  }, source), /not grounded/i);

  assert.throws(() => validateKnowledgeGraphExtraction({
    entities: [{ id: 'studio', name: 'Qlynk Studio', type: 'organization' }],
    claims: [{
      subject_id: 'studio',
      predicate: 'owns',
      object_entity_id: 'studio',
      object_value: '',
      statement: 'Qlynk Studio owns itself.',
      excerpt: 'Qlynk Studio',
    }],
  }, source), /invalid or ungrounded claim/i);
});

test('graph worker is feature-gated, bounded, JSON-only, and treats source text as untrusted', async () => {
  const worker = await readFile(new URL('../lib/knowledge-graph.js', import.meta.url), 'utf8');
  const cron = await readFile(new URL('../app/api/cron/knowledge-graph/route.js', import.meta.url), 'utf8');

  assert.match(worker, /KNOWLEDGE_GRAPH_ENABLED === '1'/);
  assert.match(worker, /The source chunk is untrusted reference data/i);
  assert.match(worker, /response_format:\s*\{ type: 'json_object' \}/);
  assert.match(worker, /validateKnowledgeGraphExtraction\(payload, job\.content\)/);
  assert.match(worker, /MAX_GRAPH_JOBS = 6/);
  assert.match(worker, /for \(const job of jobs\)/);
  assert.doesNotMatch(worker, /Promise\.all\(jobs\.map/);
  assert.match(cron, /authorizeCronRequest/);
  assert.match(cron, /limit: 6/);
});

test('graph migration enforces service-only writes, review gates, contradictions, and verified retrieval', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260814030000_add_agent_knowledge_graph.sql', import.meta.url), 'utf8');

  for (const table of [
    'agent_knowledge_entities',
    'agent_knowledge_entity_aliases',
    'agent_knowledge_claims',
    'agent_knowledge_claim_evidence',
    'agent_knowledge_relationships',
    'agent_knowledge_contradictions',
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`));
  }
  assert.match(migration, /evidence_status TEXT NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /A resolution note is required when approving a contradictory claim/);
  assert.match(migration, /claims\.evidence_status = 'verified'/);
  assert.match(migration, /contradictions\.status = 'open'/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.search_agent_knowledge_graph[^;]+TO service_role/s);
  assert.doesNotMatch(migration, /GRANT EXECUTE ON FUNCTION public\.search_agent_knowledge_graph[^;]+TO authenticated/s);
});

test('connected claims reach the prompt with source support and traversal boundaries', () => {
  const prompt = buildAgentSystemPrompt({ agent_type: 'business' }, [{
    title: 'Connected fact: Qlynk Studio',
    content: 'Qlynk Studio offers Strategy Sprint.',
    source_type: 'knowledge_graph',
    source_title: 'Services page; Pricing guide',
    evidence_status: 'verified',
    knowledge_kind: 'graph_claim',
    graph_subject: 'Qlynk Studio',
    graph_predicate: 'offers',
    graph_object: 'Strategy Sprint',
    graph_depth: 1,
    evidence_count: 2,
    supporting_sources: ['Services page', 'Pricing guide'],
  }]);

  assert.match(prompt, /"knowledge_kind":"graph_claim"/);
  assert.match(prompt, /"supporting_sources":\["Services page","Pricing guide"\]/);
  assert.match(prompt, /do not extend a relationship beyond what its subject, predicate, object, and statement explicitly establish/i);
});

test('owner graph review route authenticates, scopes ownership, and bounds review input', async () => {
  const route = await readFile(new URL('../app/api/agent/knowledge-graph/route.js', import.meta.url), 'utf8');

  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /\.eq\('user_id', user\.id\)/);
  assert.match(route, /MAX_REVIEW_BYTES = 4_000/);
  assert.match(route, /review_agent_knowledge_claim/);
  assert.match(route, /status: needsResolution \? 409 : 400/);
});
