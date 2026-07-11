import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPaidSubscriptionUpdate,
  getPlanFromStripeSubscription,
  getQlynkUserId,
  isCheckoutPaid,
} from '../lib/stripe-subscriptions.js';

const prices = { price_creator_m: 'creator', price_creator_y: 'creator', price_agency_m: 'agency' };

function subscription(overrides = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    metadata: { supabase_user_id: 'user-1' },
    items: { data: [{ price: { id: 'price_creator_m' } }] },
    ...overrides,
  };
}

function session(overrides = {}) {
  return {
    status: 'complete',
    payment_status: 'paid',
    customer: 'cus_123',
    metadata: { supabase_user_id: 'user-1', plan_name: 'agency' },
    ...overrides,
  };
}

test('tier is derived from configured Stripe price, not plan metadata', () => {
  const result = getPaidSubscriptionUpdate({ session: session(), subscription: subscription(), pricePlanMap: prices });
  assert.equal(result.update.tier, 'creator');
  assert.equal(result.update.status, 'active');
});

test('monthly and annual prices map to the same intended tier', () => {
  assert.equal(getPlanFromStripeSubscription(subscription(), prices), 'creator');
  assert.equal(getPlanFromStripeSubscription(subscription({
    items: { data: [{ price: 'price_creator_y' }] },
  }), prices), 'creator');
});

test('unknown and mixed-plan subscriptions are rejected', () => {
  assert.equal(getPlanFromStripeSubscription(subscription({
    items: { data: [{ price: { id: 'price_unknown' } }] },
  }), prices), null);
  assert.equal(getPlanFromStripeSubscription(subscription({
    items: { data: [{ price: 'price_creator_m' }, { price: 'price_agency_m' }] },
  }), prices), null);
});

test('unpaid, incomplete, canceled, and mismatched-user checkouts cannot activate', () => {
  assert.equal(isCheckoutPaid(session({ payment_status: 'unpaid' })), false);
  assert.throws(() => getPaidSubscriptionUpdate({
    session: session({ payment_status: 'unpaid' }), subscription: subscription(), pricePlanMap: prices,
  }));
  assert.throws(() => getPaidSubscriptionUpdate({
    session: session({ status: 'open' }), subscription: subscription(), pricePlanMap: prices,
  }));
  assert.throws(() => getPaidSubscriptionUpdate({
    session: session(), subscription: subscription({ status: 'canceled' }), pricePlanMap: prices,
  }));
  assert.equal(getQlynkUserId(session(), subscription({
    metadata: { supabase_user_id: 'user-2' },
  })), null);
});

test('no-payment-required active checkout is accepted', () => {
  const result = getPaidSubscriptionUpdate({
    session: session({ payment_status: 'no_payment_required' }),
    subscription: subscription(),
    pricePlanMap: prices,
  });
  assert.equal(result.update.tier, 'creator');
});
