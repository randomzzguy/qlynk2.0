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

  const session = event.data.object;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata.supabase_user_id;
        const planName = session.metadata.plan_name;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            tier: planName || 'creator',
            status: subscription.status,
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null,
          })
          .eq('user_id', userId);
        
        console.log(`[Stripe Webhook] Subscription completed for user ${userId}`);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const sub = event.data.object;
        const { data: currentSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();

        if (currentSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: sub.status,
              tier: sub.status === 'active' || sub.status === 'trialing' ? undefined : 'free', // Downgrade if inactive
            })
            .eq('stripe_subscription_id', sub.id);
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
