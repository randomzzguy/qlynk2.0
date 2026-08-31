import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildSubscriptionUpdateFlow,
  canUpdateExistingSubscription,
  getSingleSubscriptionItem,
} from '../lib/checkout-upgrade.js';

test('active Creator and legacy Pro members update their existing Stripe subscription', () => {
  for (const tier of ['creator', 'pro']) {
    assert.equal(canUpdateExistingSubscription({
      tier,
      status: 'active',
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
    }), true);
  }

  assert.equal(canUpdateExistingSubscription({ tier: 'trial', status: 'trialing' }), false);
  assert.equal(canUpdateExistingSubscription({
    tier: 'creator',
    status: 'canceled',
    stripe_customer_id: 'cus_123',
    stripe_subscription_id: 'sub_123',
  }), false);
});

test('subscription updates require exactly one Stripe item', () => {
  assert.deepEqual(getSingleSubscriptionItem({
    items: { data: [{ id: 'si_123', quantity: 1, price: { id: 'price_creator' } }] },
  }), { id: 'si_123', quantity: 1, priceId: 'price_creator' });

  assert.equal(getSingleSubscriptionItem({ items: { data: [] } }), null);
  assert.equal(getSingleSubscriptionItem({
    items: { data: [{ id: 'si_1' }, { id: 'si_2' }] },
  }), null);
});

test('upgrade flow deep-links to Stripe confirmation and returns to billing', () => {
  assert.deepEqual(buildSubscriptionUpdateFlow({
    subscriptionId: 'sub_123',
    itemId: 'si_123',
    priceId: 'price_agency',
    quantity: 1,
    returnUrl: 'https://www.qlynk.site/dashboard/billing',
  }), {
    type: 'subscription_update_confirm',
    subscription_update_confirm: {
      subscription: 'sub_123',
      items: [{ id: 'si_123', price: 'price_agency', quantity: 1 }],
    },
    after_completion: {
      type: 'redirect',
      redirect: { return_url: 'https://www.qlynk.site/dashboard/billing' },
    },
  });
});

test('checkout errors never send an authenticated member to signup', async () => {
  const pricingPage = await readFile('app/pricing/page.jsx', 'utf8');
  const checkoutHandler = pricingPage.slice(
    pricingPage.indexOf('const handleCheckout'),
    pricingPage.indexOf('const plans ='),
  );

  assert.doesNotMatch(checkoutHandler, /window\.location\.href\s*=\s*`\/auth\/signup/);
  assert.match(checkoutHandler, /response\.status === 401/);
  assert.match(checkoutHandler, /\/auth\/login\?next=/);
});
