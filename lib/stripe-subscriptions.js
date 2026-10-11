const PRICE_PLAN_ENTRIES = [
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY, 'creator'],
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL, 'creator'],
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY, 'agency'],
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL, 'agency'],
].filter(([priceId]) => Boolean(priceId));

export const STRIPE_PRICE_PLAN_MAP = Object.freeze(Object.fromEntries(PRICE_PLAN_ENTRIES));

export function getStripePriceId(item) {
  const price = item?.price;
  return typeof price === 'string' ? price : price?.id || null;
}

export function getInvoiceSubscriptionId(invoice) {
  const subscription = invoice?.parent?.subscription_details?.subscription || invoice?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id || null;
}

export function getPlanFromStripeSubscription(subscription, pricePlanMap = STRIPE_PRICE_PLAN_MAP) {
  const items = subscription?.items?.data || [];
  if (items.length !== 1) return null;
  const plans = new Set(
    items.map(getStripePriceId).map((priceId) => pricePlanMap[priceId]).filter(Boolean)
  );

  if (plans.size !== 1) return null;
  return [...plans][0];
}

export function getStripeSubscriptionUpdate(subscription, pricePlanMap = STRIPE_PRICE_PLAN_MAP) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!subscription.id || !customerId) throw new Error('Stripe subscription identity is missing');
  if (['canceled', 'incomplete_expired', 'paused'].includes(subscription.status)) {
    return {
      stripe_customer_id: customerId,
      // A paused Stripe subscription can resume; retain its link to prevent
      // creating a second paid subscription while providing Creator access.
      stripe_subscription_id: subscription.status === 'paused' ? subscription.id : null,
      tier: 'creator',
      status: 'active',
      trial_ends_at: null,
    };
  }
  const tier = getPlanFromStripeSubscription(subscription, pricePlanMap);
  if (!tier) throw new Error('Stripe subscription does not contain one configured Qlynk plan');
  return {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    tier,
    status: subscription.status,
    trial_ends_at: subscription.status === 'trialing' && subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };
}

export function isCheckoutPaid(session) {
  return ['paid', 'no_payment_required'].includes(session?.payment_status);
}

export function getQlynkUserId(session, subscription) {
  const sessionUserId = session?.metadata?.supabase_user_id;
  const subscriptionUserId = subscription?.metadata?.supabase_user_id;
  if (sessionUserId && subscriptionUserId && sessionUserId !== subscriptionUserId) return null;
  return sessionUserId || subscriptionUserId || null;
}

export function getPaidSubscriptionUpdate({ session, subscription, pricePlanMap = STRIPE_PRICE_PLAN_MAP }) {
  const userId = getQlynkUserId(session, subscription);
  if (!userId) throw new Error('Checkout metadata does not identify one Qlynk user');

  const tier = getPlanFromStripeSubscription(subscription, pricePlanMap);
  if (!tier) throw new Error('Stripe subscription does not contain one configured Qlynk plan');

  if (session?.status !== 'complete' || !isCheckoutPaid(session)) {
    throw new Error('Checkout session has not completed payment');
  }

  if (!['active', 'trialing'].includes(subscription?.status)) {
    throw new Error(`Stripe subscription is not active (${subscription?.status || 'unknown'})`);
  }

  return {
    userId,
    update: {
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: subscription.id,
      tier,
      status: subscription.status,
      trial_ends_at: subscription.status === 'trialing' && subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    },
  };
}
