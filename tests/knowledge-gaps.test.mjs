import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKnowledgeGapQuestion, shouldRecordKnowledgeGap } from '../lib/knowledge-gaps.js';

test('knowledge gap questions normalize for deduplication', () => {
  assert.equal(normalizeKnowledgeGapQuestion('  What TIME does breakfast start?! '), 'what time does breakfast start');
});

test('only uncertainty-style answers become automatic knowledge gaps', () => {
  assert.equal(shouldRecordKnowledgeGap("I don't have that information yet. Please contact the owner."), true);
  assert.equal(shouldRecordKnowledgeGap('Breakfast starts at 8 AM in the east dining room.'), false);
  assert.equal(shouldRecordKnowledgeGap('Please ask reception.', 'Please ask reception.'), true);
});
