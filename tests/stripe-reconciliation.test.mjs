import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvoiceSubscriptionId, getStripeSubscriptionUpdate } from '../lib/stripe-subscriptions.js';
import { reconcileStripeSubscription } from '../lib/stripe-reconciliation.js';
import { getEffectiveTier, isSubscriptionLive } from '../lib/plans.js';
import { canUpdateExistingSubscription } from '../lib/checkout-upgrade.js';

const prices = { price_agency: 'agency', price_old_creator: 'creator' };
function subscription(overrides = {}) {
  return { id: 'sub_agency', customer: 'cus_owner', status: 'active', items: { data: [{ price: 'price_agency' }] }, ...overrides };
}

test('Agency cancellation returns to free Creator and clears the ended billing link', () => {
  const update = getStripeSubscriptionUpdate(subscription({ status: 'canceled' }), prices);
  assert.equal(update.tier, 'creator');
  assert.equal(update.status, 'active');
  assert.equal(update.stripe_subscription_id, null);
  assert.equal(update.stripe_customer_id, 'cus_owner');
  assert.equal(isSubscriptionLive(update), true);
  assert.equal(Object.hasOwn(update, 'messages_used'), false);
});

test('paused Stripe billing retains its resumable link and free access without allowing a second subscription', () => {
  const update = getStripeSubscriptionUpdate(subscription({ status: 'paused' }), prices);
  assert.equal(update.stripe_subscription_id, 'sub_agency');
  assert.equal(getEffectiveTier(update), 'creator');
  assert.equal(isSubscriptionLive(update), true);
  assert.equal(canUpdateExistingSubscription(update), true);
});

test('failed payments preserve the billing link and give only free Creator entitlements', () => {
  for (const status of ['past_due', 'unpaid', 'incomplete']) {
    const update = getStripeSubscriptionUpdate(subscription({ status }), prices);
    assert.equal(update.stripe_subscription_id, 'sub_agency');
    assert.equal(getEffectiveTier(update), 'creator');
  }
  assert.equal(getEffectiveTier(getStripeSubscriptionUpdate(subscription(), prices)), 'agency');
  assert.throws(() => getStripeSubscriptionUpdate(subscription({ items: { data: [{ price: 'unknown' }] } }), prices));
});

test('current and historical Stripe invoice subscription shapes are supported', () => {
  assert.equal(getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_new' } } }), 'sub_new');
  assert.equal(getInvoiceSubscriptionId({ subscription: { id: 'sub_old' } }), 'sub_old');
  assert.equal(getInvoiceSubscriptionId({}), null);
});

test('replayed deletion and an old subscription event cannot downgrade a new Agency upgrade', async () => {
  let row = { user_id: 'owner', stripe_subscription_id: 'sub_agency', tier: 'agency', status: 'active', messages_used: 4000 };
  const admin = { from(table) {
    assert.equal(table, 'subscriptions');
    return { update(update) { return { eq(column, id) {
      assert.equal(column, 'stripe_subscription_id');
      return { async select() {
        if (row.stripe_subscription_id !== id) return { data: [], error: null };
        row = { ...row, ...update };
        return { data: [{ user_id: row.user_id }], error: null };
      } };
    } }; } };
  } };
  assert.equal((await reconcileStripeSubscription(admin, subscription({ status: 'canceled' }), prices)).updated, true);
  assert.equal((await reconcileStripeSubscription(admin, subscription({ status: 'canceled' }), prices)).updated, false);
  row = { ...row, stripe_subscription_id: 'sub_new_agency', tier: 'agency', status: 'active' };
  assert.equal((await reconcileStripeSubscription(admin, subscription({ status: 'canceled' }), prices)).updated, false);
  assert.equal(row.tier, 'agency');
  assert.equal(row.messages_used, 4000);
});
