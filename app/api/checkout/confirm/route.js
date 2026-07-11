import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getPaidSubscriptionUpdate } from '@/lib/stripe-subscriptions';

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
    const { userId, update } = getPaidSubscriptionUpdate({ session, subscription });

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`[Checkout Confirm] Reconciling paid plan for user ${userId}`);

    // Update database synchronously.
    // status is forced to 'active' and trial_ends_at is cleared —
    // the user has paid so their trial is done regardless of Stripe's subscription state.
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(update)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('[Checkout Confirm] DB Update Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tier: update.tier,
      status: update.status,
      updated: true,
      data: data?.[0]
    });
  } catch (error) {
    console.error('[Checkout Confirm] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
