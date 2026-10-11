import test from 'node:test';
import assert from 'node:assert/strict';

import { getMessageLimit, hasAgencyFeatures, isSubscriptionLive, getEffectiveTier, getCurrentMessagesUsed, isComplimentaryAgency } from '../lib/plans.js';

test('legacy trials inherit permanent Creator access without Agency branding', () => {
  assert.equal(getMessageLimit('trial'), 5000);
  assert.equal(hasAgencyFeatures('trial'), false);
  assert.equal(isSubscriptionLive({ tier: 'trial', status: 'canceled', trial_ends_at: '2020-01-01' }), true);
  assert.equal(getEffectiveTier({ tier: 'trial', status: 'trialing' }), 'creator');
  assert.equal(hasAgencyFeatures('agency'), true);
});

test('Creator and legacy free accounts stay available without billing or expiry', () => {
  for (const tier of ['creator', 'pro', 'free']) {
    assert.equal(isSubscriptionLive({ tier, status: 'active' }), true);
    assert.equal(isSubscriptionLive({ tier, status: 'canceled' }), true);
    assert.equal(getEffectiveTier({ tier, status: 'active' }), 'creator');
  }
  assert.equal(isSubscriptionLive(null), false);
  assert.equal(isSubscriptionLive({ tier: 'unknown', status: 'active' }), false);
  assert.equal(isSubscriptionLive({ tier: 'creator', status: 'paused' }), false);
  assert.equal(getMessageLimit('unknown'), 0);
});

test('active Agency entitlements receive their allowance and branding benefits', () => {
  for (const tier of ['agency', 'business']) {
    assert.equal(getEffectiveTier({ tier, status: 'active' }), 'agency');
    assert.equal(getMessageLimit(getEffectiveTier({ tier, status: 'active' })), 10000);
    for (const status of ['past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired']) {
      const subscription = { tier, status };
      assert.equal(getEffectiveTier(subscription), 'creator');
      assert.equal(isSubscriptionLive(subscription), true);
      assert.equal(hasAgencyFeatures(getEffectiveTier(subscription)), false);
    }
  }
});

test('complimentary Agency provides normal Agency entitlements without a Stripe subscription', () => {
  const granted = { tier: 'agency', status: 'active', stripe_subscription_id: null, stripe_customer_id: null };
  assert.equal(isComplimentaryAgency(granted), true);
  assert.equal(isSubscriptionLive(granted), true);
  assert.equal(getMessageLimit(getEffectiveTier(granted)), 10000);
  assert.equal(hasAgencyFeatures(getEffectiveTier(granted)), true);
  assert.equal(isComplimentaryAgency({ ...granted, stripe_subscription_id: 'sub_paid' }), false);
  assert.equal(isComplimentaryAgency({ ...granted, status: 'paused' }), false);
  assert.equal(isComplimentaryAgency({ ...granted, tier: 'creator' }), false);
});

test('displayed usage follows UTC calendar rollover, including December to January', () => {
  const now = new Date('2027-01-01T00:00:00Z');
  assert.equal(getCurrentMessagesUsed({ messages_used: 5000, last_reset_at: '2026-12-31T23:59:59Z' }, now), 0);
  assert.equal(getCurrentMessagesUsed({ messages_used: 7, last_reset_at: '2027-01-01T00:00:00Z' }, now), 7);
});

test('Creator keeps its lower allowance and Qlynk branding', () => {
  assert.equal(getMessageLimit('creator'), 5000);
  assert.equal(hasAgencyFeatures('creator'), false);
});
