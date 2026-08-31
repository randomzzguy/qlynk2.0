import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { PAID_PLAN_PRICING } from '../lib/pricing.js';

const pricingSources = [
  'app/layout.jsx',
  'app/pricing/page.jsx',
  'components/TrialChoiceManager.jsx',
  'app/compare/qlynk-vs-chatbase/page.jsx',
  'public/llms.txt',
];

test('current paid-plan prices match the post-August pricing plan', () => {
  assert.deepEqual(PAID_PLAN_PRICING, {
    creator: { monthly: 18, annual: 168 },
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
  ]) {
    assert.doesNotMatch(content, new RegExp(retiredClaim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  assert.match(content, /Creator is \$18 monthly or \$168 annually/);
  assert.match(content, /Agency is \$38 monthly or \$360 annually/);
  assert.match(content, /Pricing as of 2026-08-31/);
});
