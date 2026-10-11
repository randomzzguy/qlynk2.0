import test from 'node:test';
import assert from 'node:assert/strict';
import { getManagedProductFacts, getProductUpdatePreview, getQlynkProductRuleUpdate, isObsoleteQlynkProductSource } from '../lib/qlynk-product-update.js';

test('the product update removes audited stale instructions while preserving other owner rules', () => {
  const rules = {
    purpose: 'Explain Qlynk.', daily_message_limit: 100, blocked_topics: ['Secrets'],
    allowed_topics: ['Setup', 'Trial, plans, pricing, and message allowances'],
    behavior_rules: ['Use approved knowledge', 'For prices, state the promotion period, first-payment scope, and regular renewal price'],
    custom_instructions: 'Keep privacy boundaries. Current public plans are Trial, Creator, and Agency. Pricing verified August 14, 2026: first Creator payment is $9, renewing at $18. The discount applies only to the first payment. Keep human handoff.',
  };
  const updated = getQlynkProductRuleUpdate(rules);
  assert.equal(updated.daily_message_limit, 100);
  assert.deepEqual(updated.blocked_topics, rules.blocked_topics);
  assert.match(updated.custom_instructions, /free forever.*5,000.*\$38.*\$360.*MIT/);
  assert.match(updated.custom_instructions, /Keep privacy boundaries.*Keep human handoff/);
  assert.equal(isObsoleteQlynkProductSource({ content: JSON.stringify(updated) }), false);
  assert.match(rules.custom_instructions, /\$18/);
});

test('all obsolete plan, trial and promotion sources are selected without archiving unrelated knowledge', () => {
  for (const content of [
    'The 14-day Trial includes Agency features.',
    'Creator costs $18/month or $168/year.',
    'Get 50% off through August 31, 2026.',
    'Fourteen-day Trial: free Agency access.',
    'Trial has 10,000 messages.',
    'Your trial expires and goes offline.',
    'The hosted page requires a live trial or paid plan.',
  ]) assert.equal(isObsoleteQlynkProductSource({ content }), true, content);
  for (const content of ['Supported documents must be 3 MB or smaller.', 'Refund requests within 14 days of purchase.', 'The agent does not complete transactions.']) {
    assert.equal(isObsoleteQlynkProductSource({ content }), false, content);
  }
  assert.equal(isObsoleteQlynkProductSource({ title: 'Old pricing', content: '$18', is_active: false }), false);
});

test('the preview handles facts, FAQs and stale indexed URLs and recognizes an already current pack', () => {
  const oldSources = [
    { id: 'fact', source_type: 'text', title: 'Creator', content: 'Creator costs $18.' },
    { id: 'faq', source_type: 'faq', title: 'Free trial?', content: '14-day free trial' },
    { id: 'url', source_type: 'url', title: 'Pricing', content: 'First payment is $9' },
    { id: 'preserve', source_type: 'text', title: 'Scope', content: 'Use approved knowledge.' },
  ];
  const preview = getProductUpdatePreview(oldSources);
  assert.deepEqual(preview.staleSources.map(item => item.id), ['fact', 'faq', 'url']);
  assert.equal(preview.facts.length, 8);
  assert.equal(preview.changedFactCount, 8);
  assert.equal(getProductUpdatePreview(getManagedProductFacts()).changedFactCount, 0);
});
