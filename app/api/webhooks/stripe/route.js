import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata?.supabase_user_id || subscription.metadata?.supabase_user_id;
        const planName = session.metadata?.plan_name || subscription.metadata?.plan_name || 'creator';

        if (userId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              tier: planName.toLowerCase(),
              status: subscription.status,
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            })
            .eq('user_id', userId);
        }
        
        console.log(`[Stripe Webhook] Subscription completed for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const updates = {
          stripe_customer_id: sub.customer,
          status: sub.status,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        };

        if (sub.metadata?.plan_name) {
          updates.tier = sub.metadata.plan_name.toLowerCase();
        }

        await supabaseAdmin
          .from('subscriptions')
          .update(updates)
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free',
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
