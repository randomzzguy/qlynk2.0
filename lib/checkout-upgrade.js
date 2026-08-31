import { LIVE_PAID_STATUSES, normalizeTier, PAID_PLAN_TIERS } from './plans.js';

export function canUpdateExistingSubscription(subscription) {
  const tier = normalizeTier(subscription?.tier);
  const status = subscription?.status?.toLowerCase?.();

  return Boolean(
    subscription?.stripe_customer_id
    && subscription?.stripe_subscription_id
    && PAID_PLAN_TIERS.includes(tier)
    && LIVE_PAID_STATUSES.includes(status)
  );
}

export function getSingleSubscriptionItem(subscription) {
  const items = subscription?.items?.data || [];
  if (items.length !== 1 || !items[0]?.id) return null;

  return {
    id: items[0].id,
    quantity: items[0].quantity ?? 1,
    priceId: typeof items[0].price === 'string' ? items[0].price : items[0].price?.id || null,
  };
}

export function buildSubscriptionUpdateFlow({ subscriptionId, itemId, priceId, quantity, returnUrl }) {
  return {
    type: 'subscription_update_confirm',
    subscription_update_confirm: {
      subscription: subscriptionId,
      items: [{ id: itemId, price: priceId, quantity }],
    },
    after_completion: {
      type: 'redirect',
      redirect: { return_url: returnUrl },
    },
  };
}

export function portalConfigurationSupportsPrice(configuration, priceId) {
  const subscriptionUpdate = configuration?.features?.subscription_update;
  if (!subscriptionUpdate?.enabled) return false;

  return (subscriptionUpdate.products || []).some((product) =>
    (product.prices || []).includes(priceId)
  );
}
