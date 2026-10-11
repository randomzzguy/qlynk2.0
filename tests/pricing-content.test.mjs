import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { PAID_PLAN_PRICING, PLAN_PRICING } from '../lib/pricing.js';
import { QLYNK_PRICING_FAQS, getQlynkProductKnowledge } from '../lib/qlynk-product-facts.js';

const pricingSources = [
  'app/layout.jsx',
  'app/pricing/page.jsx',
  'components/TrialChoiceManager.jsx',
  'app/compare/qlynk-vs-chatbase/page.jsx',
  'public/llms.txt',
];

test('Creator is always free and Agency is the only new paid plan', () => {
  assert.deepEqual(PLAN_PRICING.creator, { monthly: 0, annual: 0 });
  assert.deepEqual(PAID_PLAN_PRICING, {
    agency: { monthly: 38, annual: 360 },
  });
});

test('live pricing surfaces do not advertise the expired August offer', async () => {
  const content = (await Promise.all(pricingSources.map((file) => readFile(file, 'utf8')))).join('\n');

  for (const retiredClaim of [
    'August offer',
    '50% off',
    'Offer ends Aug 31, 2026',
    'priceValidUntil',
    '$9 monthly',
    '$19 monthly',
    '$84 annually',
    '$180 annually',
    '$18 monthly',
    '$168 annually',
    'free for 14 days',
  ]) {
    assert.doesNotMatch(content, new RegExp(retiredClaim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  assert.match(content, /Agency is \$38 monthly or \$360 annually/);
  assert.match(content, /Pricing as of 2026-10-11/);
});

test('product-agent facts explain free access, limits, cancellation, storage and self-hosting', () => {
  const knowledge = getQlynkProductKnowledge().map(item => item.content).join('\n');
  assert.match(knowledge, /no expiry and no credit card/);
  assert.match(knowledge, /5,000 messages/);
  assert.match(knowledge, /10,000 messages/);
  assert.match(knowledge, /\$38 monthly or \$360 annually/);
  assert.match(knowledge, /return to free Creator/);
  assert.match(knowledge, /no automatic overage charges/);
  assert.match(knowledge, /3 MB per file/);
  assert.match(knowledge, /MIT/);
  assert.match(knowledge, /provider and hosting costs are your responsibility/);
  assert.ok(QLYNK_PRICING_FAQS.length >= 7);
});
