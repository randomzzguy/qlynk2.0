import test from 'node:test';
import assert from 'node:assert/strict';

import { getMessageLimit, hasAgencyFeatures } from '../lib/plans.js';

test('the 14-day trial mirrors Agency message and branding access', () => {
  assert.equal(getMessageLimit('trial'), getMessageLimit('agency'));
  assert.equal(getMessageLimit('trial'), 10000);
  assert.equal(hasAgencyFeatures('trial'), true);
  assert.equal(hasAgencyFeatures('agency'), true);
});

test('Creator keeps its lower allowance and Qlynk branding', () => {
  assert.equal(getMessageLimit('creator'), 5000);
  assert.equal(hasAgencyFeatures('creator'), false);
});
