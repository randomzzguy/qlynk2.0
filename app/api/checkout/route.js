import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { STRIPE_PRICE_PLAN_MAP } from '@/lib/stripe-subscriptions';
import { isComplimentaryAgency } from '@/lib/plans';
import {
  buildSubscriptionUpdateFlow,
  canUpdateExistingSubscription,
  getSingleSubscriptionItem,
} from '@/lib/checkout-upgrade';

export async function POST(req) {
  if (process.env.NEXT_PUBLIC_BILLING_ENABLED === '0') {
    return NextResponse.json({ error: 'Paid billing is disabled on this deployment. Creator remains free.' }, { status: 503 });
  }
  try {
    const { priceId } = await req.json();
    const normalizedPlanName = STRIPE_PRICE_PLAN_MAP[priceId];

    if (normalizedPlanName !== 'agency') {
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
    const { data: existingSubscription, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, trial_ends_at, tier, status')
      .eq('user_id', user.id)
      .single();

    if (subscriptionError) {
      throw new Error(`Could not load subscription: ${subscriptionError.message}`);
    }

    if (isComplimentaryAgency(existingSubscription)) {
      return NextResponse.json({ error: 'Your account already has complimentary Agency access. No payment is required.' }, { status: 409 });
    }

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (canUpdateExistingSubscription(existingSubscription)) {
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          existingSubscription.stripe_subscription_id
        );
      } catch (error) {
        if (error.code === 'resource_missing') {
          return NextResponse.json(
            { error: 'This subscription is connected to a previous billing account. Please contact support from Billing to change plans safely.' },
            { status: 409 }
          );
        }
        throw error;
      }
      const stripeCustomerId = typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id;

      if (stripeCustomerId !== customerId) {
        return NextResponse.json(
          { error: 'The saved billing customer does not match this subscription.' },
          { status: 409 }
        );
      }

      const subscriptionItem = getSingleSubscriptionItem(stripeSubscription);

      if (!subscriptionItem) {
        return NextResponse.json(
          { error: 'This subscription cannot be changed automatically. Manage it from Billing instead.' },
          { status: 409 }
        );
      }

      if (subscriptionItem.priceId === priceId) {
        return NextResponse.json({ error: 'You are already subscribed to this plan.' }, { status: 409 });
      }

      const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
      if (!portalConfigurationId) {
        return NextResponse.json(
          { error: 'Plan changes are temporarily unavailable. Please contact support from Billing.' },
          { status: 503 }
        );
      }

      const returnUrl = `${siteUrl}/dashboard/billing`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        configuration: portalConfigurationId,
        return_url: returnUrl,
        flow_data: buildSubscriptionUpdateFlow({
          subscriptionId: existingSubscription.stripe_subscription_id,
          itemId: subscriptionItem.id,
          priceId,
          quantity: subscriptionItem.quantity,
          returnUrl,
        }),
      });

      return NextResponse.json({ url: portalSession.url, flow: 'subscription_update' });
    }

    // Creator never enters Stripe. Agency checkout charges immediately.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan_name: normalizedPlanName,
      },
      subscription_data: {
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
