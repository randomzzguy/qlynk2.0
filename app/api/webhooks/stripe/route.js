import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { subscriptionRenewedEmail } from '@/lib/email/templates/subscription-renewed';
import { paymentFailedEmail } from '@/lib/email/templates/payment-failed';
import { buildEmailPreferencesUrl } from '@/lib/email/preferences';
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
} from '@/lib/stripe-webhook-events';
import { getPaidSubscriptionUpdate, getPlanFromStripeSubscription } from '@/lib/stripe-subscriptions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function requireUpdatedRows(data, error, operation) {
  if (error) throw new Error(`${operation} failed: ${error.message}`);
  if (!data?.length) throw new Error(`${operation} did not match a subscription`);
  return data;
}

async function sendRequiredWebhookEmail(eventId, kind, email) {
  const result = await sendEmail({
    ...email,
    idempotencyKey: `stripe-${eventId}-${kind}`,
  });
  if (!result.success) {
    throw new Error(`${kind} email failed: ${result.error || 'unknown email error'}`);
  }
}

async function getSubscriptionEmailPreference(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('notif_subscription')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Subscription email preference lookup failed: ${error.message}`);
  return data?.notif_subscription !== false;
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    console.warn('[Stripe Webhook] Signature verification failed');
    return new Response('Invalid webhook signature', { status: 400 });
  }

  let claimed = false;
  try {
    const claim = await claimStripeWebhookEvent(supabaseAdmin, event);
    if (!claim.claimed) {
      console.log(`[Stripe Webhook] Event ${event.id} already ${claim.reason}`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    claimed = true;

    console.log(`[Stripe Webhook] Processing ${event.id} (${event.type})`);
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (!session.subscription) throw new Error('Checkout session has no subscription');
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const { userId, update } = getPaidSubscriptionUpdate({ session, subscription });
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .update(update)
          .eq('user_id', userId)
          .select('user_id');
        requireUpdatedRows(data, error, 'Checkout subscription update');
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const updates = {
          stripe_customer_id: sub.customer,
          status: sub.status,
        };

        const configuredTier = getPlanFromStripeSubscription(sub);
        if (configuredTier) updates.tier = configuredTier;

        // Only update trial_ends_at for genuinely trialing (DB-managed) subscriptions.
        // For active paid plans we never overwrite trial_ends_at from Stripe
        // to avoid re-gifting trials or erasing trial history.
        if (sub.status === 'trialing' && sub.trial_end) {
          updates.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
        } else if (sub.status === 'active') {
          updates.trial_ends_at = null; // Clear trial: they transitioned to active paid
        }

        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .update(updates)
          .eq('stripe_subscription_id', sub.id)
          .select('user_id');
        requireUpdatedRows(data, error, 'Stripe subscription update');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = sub.metadata?.supabase_user_id;
          if (userId) {
            const [{ data: authUser }, notificationEnabled] = await Promise.all([
              supabaseAdmin.auth.admin.getUserById(userId),
              getSubscriptionEmailPreference(userId),
            ]);
            const userEmail = authUser?.user?.email;
            const username = authUser?.user?.user_metadata?.username || 'there';
            const planName = sub.metadata?.plan_name || sub.items?.data?.[0]?.price?.nickname || 'Pro';
            const nextRenewal = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : null;
            if (userEmail && notificationEnabled) {
              await sendRequiredWebhookEmail(event.id, 'renewal', {
                to: userEmail,
                ...subscriptionRenewedEmail({
                  username,
                  planName,
                  renewalDate: nextRenewal,
                  preferencesUrl: buildEmailPreferencesUrl(userId, 'subscription'),
                }),
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = sub.metadata?.supabase_user_id;
          if (userId) {
            const [{ data: authUser }, notificationEnabled] = await Promise.all([
              supabaseAdmin.auth.admin.getUserById(userId),
              getSubscriptionEmailPreference(userId),
            ]);
            const userEmail = authUser?.user?.email;
            const username = authUser?.user?.user_metadata?.username || 'there';
            const planName = sub.metadata?.plan_name || sub.items?.data?.[0]?.price?.nickname || 'Pro';
            const amountDue = typeof invoice.amount_due === 'number'
              ? `${(invoice.amount_due / 100).toFixed(2)} ${String(invoice.currency || 'usd').toUpperCase()}`
              : null;

            const { data, error } = await supabaseAdmin
              .from('subscriptions')
              .update({
                status: 'past_due',
                stripe_customer_id: sub.customer,
              })
              .eq('stripe_subscription_id', sub.id)
              .select('user_id');
            requireUpdatedRows(data, error, 'Failed-payment subscription update');

            if (userEmail && notificationEnabled) {
              await sendRequiredWebhookEmail(event.id, 'payment-failed', {
                to: userEmail,
                ...paymentFailedEmail({
                  username,
                  planName,
                  amountDue,
                  invoiceUrl: invoice.hosted_invoice_url || 'https://qlynk.site/dashboard/billing',
                  preferencesUrl: buildEmailPreferencesUrl(userId, 'subscription'),
                }),
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free',
          })
          .eq('stripe_subscription_id', sub.id)
          .select('user_id');
        requireUpdatedRows(data, error, 'Deleted-subscription update');
        break;
      }
    }

    await completeStripeWebhookEvent(supabaseAdmin, event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Event ${event.id} failed: ${error.message}`);
    if (claimed) {
      try {
        await failStripeWebhookEvent(supabaseAdmin, event.id, error);
      } catch (ledgerError) {
        console.error(`[Stripe Webhook] Could not mark ${event.id} failed: ${ledgerError.message}`);
      }
    }
    return new Response('Webhook processing failed', { status: 500 });
  }
}
