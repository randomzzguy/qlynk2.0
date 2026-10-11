export const PLAN_LIMITS = {
  // Legacy trial/free rows receive the permanent Creator allowance.
  trial: 5000,
  free: 5000,
  creator: 5000,
  pro: 5000,
  agency: 10000,
  business: 10000,
};

export const PAID_PLAN_TIERS = ['agency', 'business'];
export const LEGACY_PAID_PLAN_TIERS = ['creator', 'pro'];
export const LIVE_PAID_STATUSES = ['active', 'trialing'];
export const AGENCY_FEATURE_TIERS = ['agency', 'business'];

export function normalizeTier(tier) {
  return tier?.toLowerCase?.() || 'creator';
}

export function getEffectiveTier(subscription) {
  const tier = normalizeTier(subscription?.tier);
  return PAID_PLAN_TIERS.includes(tier)
    && LIVE_PAID_STATUSES.includes(subscription?.status?.toLowerCase?.())
    ? 'agency'
    : 'creator';
}

// Granted by an administrator through the protected subscription record.
// Ordinary account owners cannot edit subscription entitlement fields.
export function isComplimentaryAgency(subscription) {
  return getEffectiveTier(subscription) === 'agency'
    && subscription?.status?.toLowerCase?.() === 'active'
    && !subscription?.stripe_subscription_id;
}

export function isSubscriptionLive(subscription) {
  if (!subscription) return false;
  const tier = normalizeTier(subscription.tier);
  const status = subscription.status?.toLowerCase?.();
  // Explicit suspension remains respected; failed/ended billing falls back to Creator.
  return ['active', 'trialing', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired'].includes(status)
    && Object.hasOwn(PLAN_LIMITS, tier);
}

export function getCurrentMessagesUsed(subscription, now = new Date()) {
  const lastReset = new Date(subscription?.last_reset_at || subscription?.created_at || 0);
  if (lastReset.getUTCFullYear() !== now.getUTCFullYear()
    || lastReset.getUTCMonth() !== now.getUTCMonth()) return 0;
  return Math.max(0, Number(subscription?.messages_used) || 0);
}

export function getMessageLimit(tier) {
  return PLAN_LIMITS[normalizeTier(tier)] || 0;
}

export function hasAgencyFeatures(tier) {
  return AGENCY_FEATURE_TIERS.includes(normalizeTier(tier));
}
