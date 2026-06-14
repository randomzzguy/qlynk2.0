import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Checkout Confirm] Verifying session: ${session_id}`);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Ensure session is completed
    if (session.status !== 'complete') {
      console.log(`[Checkout Confirm] Session status is not complete: ${session.status}`);
      return NextResponse.json({ status: session.status, updated: false });
    }

    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.log(`[Checkout Confirm] No subscription found on session: ${session_id}`);
      return NextResponse.json({ error: 'No subscription associated with this checkout session' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const userId = session.metadata?.supabase_user_id || subscription.metadata?.supabase_user_id;
    const planName = session.metadata?.plan_name || subscription.metadata?.plan_name || 'creator';

    if (!userId) {
      console.warn(`[Checkout Confirm] No user ID resolved in metadata for session ${session_id}`);
      return NextResponse.json({ error: 'User ID not found in metadata' }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tier = planName.toLowerCase();
    console.log(`[Checkout Confirm] Activating paid plan for user: ${userId} → ${tier}`);

    // Update database synchronously.
    // status is forced to 'active' and trial_ends_at is cleared —
    // the user has paid so their trial is done regardless of Stripe's subscription state.
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        tier,
        status: 'active',
        trial_ends_at: null,
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('[Checkout Confirm] DB Update Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Checkout Confirm] DB Update Success:`, data);

    return NextResponse.json({
      success: true,
      tier,
      status: 'active',
      updated: true,
      data: data?.[0]
    });
  } catch (error) {
    console.error('[Checkout Confirm] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
