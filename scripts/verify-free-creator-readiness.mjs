import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { STRIPE_PRICE_PLAN_MAP, getPlanFromStripeSubscription } from '../lib/stripe-subscriptions.js';
import { PLAN_PRICING } from '../lib/pricing.js';

// Read-only production preflight. Never applies migrations or changes billing.
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const blockers = [];
for (const [cycle, variable, interval] of [
  ['monthly', 'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY', 'month'],
  ['annual', 'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL', 'year'],
]) {
  if (!process.env[variable]) { blockers.push(`${variable} is missing`); continue; }
  const price = await stripe.prices.retrieve(process.env[variable]);
  if (!price.active || price.currency !== 'usd' || price.unit_amount !== PLAN_PRICING.agency[cycle] * 100
    || price.recurring?.interval !== interval || price.recurring?.interval_count !== 1) blockers.push(`Agency ${cycle} price does not match the published contract`);
}
let legacyCreatorBilling = 0;
for await (const subscription of stripe.subscriptions.list({ status: 'all', limit: 100 })) {
  if (['canceled', 'incomplete_expired'].includes(subscription.status)) continue;
  const tier = getPlanFromStripeSubscription(subscription, STRIPE_PRICE_PLAN_MAP) || subscription.metadata?.plan_name;
  if (['creator', 'pro'].includes(tier?.toLowerCase?.())) legacyCreatorBilling++;
}
console.log(`Open historical paid Creator subscriptions: ${legacyCreatorBilling}`);
if (legacyCreatorBilling) blockers.push('Reconcile historical paid Creator subscriptions in Stripe before announcing free Creator');
for (const [name, tiers] of [['legacy trial/free', ['trial', 'free']], ['linked Creator billing', ['creator', 'pro']]]) {
  let query = admin.from('subscriptions').select('user_id', { count: 'exact', head: true }).in('tier', tiers);
  if (name === 'linked Creator billing') query = query.not('stripe_subscription_id', 'is', null);
  const { count, error } = await query;
  if (error) throw new Error(`Unable to audit ${name}: ${error.message}`);
  console.log(`${name} database rows: ${count || 0}`);
  if (name === 'linked Creator billing' && count) blockers.push('Reconcile linked Creator billing rows with their actual Stripe account');
}
if (blockers.length) {
  blockers.forEach(blocker => console.error(`- ${blocker}`));
  process.exitCode = 1;
} else console.log('Read-only free Creator billing preflight passed. No customer data or credentials were printed.');
