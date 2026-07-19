import { createHmac, timingSafeEqual } from 'node:crypto';

export const EMAIL_PREFERENCE_CATEGORIES = Object.freeze({
  new_message: ['notif_new_message'],
  trial_expiry: ['notif_trial_expiry'],
  subscription: ['notif_subscription'],
  all: ['notif_new_message', 'notif_trial_expiry', 'notif_subscription'],
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/i;

function getSigningKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create email preference links');
  }

  return createHmac('sha256', serviceRoleKey)
    .update('qlynk-email-preferences-v1')
    .digest();
}

function signPreferencePayload(userId, category) {
  return createHmac('sha256', getSigningKey())
    .update(`${userId}:${category}`)
    .digest('hex');
}

export function isValidEmailPreferenceCategory(category) {
  return Object.hasOwn(EMAIL_PREFERENCE_CATEGORIES, category);
}

export function buildEmailPreferencesUrl(userId, category = 'all') {
  if (!UUID_PATTERN.test(userId) || !isValidEmailPreferenceCategory(category)) {
    throw new Error('Invalid email preference link parameters');
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://qlynk.site').replace(/\/+$/, '');
  const url = new URL('/email-preferences', siteUrl);
  url.searchParams.set('uid', userId);
  url.searchParams.set('category', category);
  url.searchParams.set('signature', signPreferencePayload(userId, category));
  return url.toString();
}

export function verifyEmailPreferencesToken(userId, category, signature) {
  if (
    !UUID_PATTERN.test(userId || '')
    || !isValidEmailPreferenceCategory(category)
    || !SIGNATURE_PATTERN.test(signature || '')
  ) {
    return false;
  }

  const expected = Buffer.from(signPreferencePayload(userId, category), 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getEmailPreferenceUpdate(category) {
  if (!isValidEmailPreferenceCategory(category)) return null;
  return Object.fromEntries(EMAIL_PREFERENCE_CATEGORIES[category].map((column) => [column, false]));
}
