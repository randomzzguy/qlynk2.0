import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin access in webhook
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
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.updated':
      const subscription = await stripe.subscriptions.retrieve(session.subscription || session.id);
      
      const userId = subscription.metadata.supabase_user_id || session.metadata?.supabase_user_id;
      const planName = subscription.metadata.plan_name || session.metadata?.plan_name || 'pro'; // default to pro

      if (userId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            tier: planName.toLowerCase(),
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq('user_id', userId);
      }
      break;

    case 'customer.subscription.deleted':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          tier: 'free', // Downgrade to free on cancellation
        })
        .eq('stripe_subscription_id', session.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
