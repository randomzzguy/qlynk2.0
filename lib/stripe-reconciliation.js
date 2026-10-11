import { getStripeSubscriptionUpdate } from './stripe-subscriptions.js';

// A delayed event from an old subscription must never overwrite a later upgrade.
// Replaying a deletion after its ID was cleared is a successful no-op.
export async function reconcileStripeSubscription(admin, subscription, pricePlanMap) {
  const update = getStripeSubscriptionUpdate(subscription, pricePlanMap);
  const { data, error } = await admin.from('subscriptions')
    .update(update)
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id');
  if (error) throw new Error(`Stripe subscription reconciliation failed: ${error.message}`);
  return { updated: Boolean(data?.length), userIds: (data || []).map(row => row.user_id) };
}
