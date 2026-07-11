import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { STRIPE_PRICE_PLAN_MAP } from '@/lib/stripe-subscriptions';

export async function POST(req) {
  try {
    const { priceId } = await req.json();
    const normalizedPlanName = STRIPE_PRICE_PLAN_MAP[priceId];

    if (!normalizedPlanName) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price IDs are not configured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get or create Stripe customer
    const { data: existingSubscription } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id, trial_ends_at, tier')
      .eq('user_id', user.id)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID immediately
      await adminSupabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create checkout session.
    // NOTE: We do NOT pass trial_period_days to Stripe.
    // Trials are managed entirely in our database (set at signup).
    // When a user reaches checkout, they are always paying immediately.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan_name: normalizedPlanName,
      },
      subscription_data: {
        // No trial_period_days — trials are DB-side only
        metadata: {
          supabase_user_id: user.id,
          plan_name: normalizedPlanName,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
