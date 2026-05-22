export const PLAN_LIMITS = {
  trial: 1000,
  creator: 5000,
  pro: 5000,
  agency: 10000,
  business: 10000,
};

export const PAID_PLAN_TIERS = ['creator', 'agency', 'pro', 'business'];
export const LIVE_PAID_STATUSES = ['active', 'trialing'];

export function normalizeTier(tier) {
  return tier?.toLowerCase?.() || 'trial';
}

export function isSubscriptionLive(subscription) {
  if (!subscription) return false;

  const tier = normalizeTier(subscription.tier);
  const status = subscription.status?.toLowerCase?.();
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;

  if (status === 'paused' || status === 'canceled' || status === 'incomplete_expired') {
    return false;
  }

  if (tier === 'trial') {
    return Boolean(trialEndsAt && trialEndsAt > new Date());
  }

  return PAID_PLAN_TIERS.includes(tier) && LIVE_PAID_STATUSES.includes(status);
}

export function getMessageLimit(tier) {
  return PLAN_LIMITS[normalizeTier(tier)] || 0;
}
