import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { subscriptionRenewedEmail } from '@/lib/email/templates/subscription-renewed';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    console.log(`[Stripe Webhook] Received event of type: ${event.type}`);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`[Stripe Webhook] Session details:`, {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
        });

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata?.supabase_user_id || subscription.metadata?.supabase_user_id;
        const planName = session.metadata?.plan_name || subscription.metadata?.plan_name || 'creator';

        console.log(`[Stripe Webhook] Resolved metadata:`, { userId, planName });

        if (userId) {
          const tier = planName.toLowerCase();
          const updatePayload = {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            tier,
            status: 'active', // They just paid — force active regardless of Stripe state
            trial_ends_at: null, // Clear trial: once paid, trial is over
          };

          const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .update(updatePayload)
            .eq('user_id', userId)
            .select();

          if (error) {
            console.error(`[Stripe Webhook] DB Update Error:`, error.message);
          } else {
            console.log(`[Stripe Webhook] DB Update Success (user ${userId} → ${tier}):`, data);
          }
        } else {
          console.warn(`[Stripe Webhook] No userId found in session or subscription metadata!`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log(`[Stripe Webhook] Subscription update details:`, {
          id: sub.id,
          status: sub.status,
          metadata: sub.metadata,
        });

        const updates = {
          stripe_customer_id: sub.customer,
          status: sub.status,
        };

        if (sub.metadata?.plan_name) {
          updates.tier = sub.metadata.plan_name.toLowerCase();
        }

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
          .select();

        if (error) {
          console.error(`[Stripe Webhook] DB Update Error on sub.update:`, error.message);
        } else {
          console.log(`[Stripe Webhook] DB Update Success on sub.update:`, data);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = sub.metadata?.supabase_user_id;
          if (userId) {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            const userEmail = authUser?.user?.email;
            const username = authUser?.user?.user_metadata?.username || 'there';
            const planName = sub.metadata?.plan_name || sub.items?.data?.[0]?.price?.nickname || 'Pro';
            const nextRenewal = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : null;
            if (userEmail) {
              sendEmail({
                to: userEmail,
                ...subscriptionRenewedEmail({ username, planName, renewalDate: nextRenewal }),
              }).catch((err) => console.error('[Stripe Webhook] Renewal email failed:', err));
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`[Stripe Webhook] Subscription deleted:`, sub.id);

        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free',
          })
          .eq('stripe_subscription_id', sub.id)
          .select();

        if (error) {
          console.error(`[Stripe Webhook] DB Update Error on sub.delete:`, error.message);
        } else {
          console.log(`[Stripe Webhook] DB Update Success on sub.delete:`, data);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
