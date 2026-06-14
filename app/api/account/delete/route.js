import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import {
  cancelScheduledAccountDeletion,
  deleteAccountData,
  scheduleAccountDeletion,
} from '@/lib/accountDeletion';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const mode = String(body?.mode || 'immediate').trim().toLowerCase();
    const confirmation = String(body?.confirmation || '').trim();
    const typedEmail = String(body?.email || '').trim().toLowerCase();

    if (!['immediate', 'scheduled', 'cancel'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid deletion mode' }, { status: 400 });
    }

    if (mode === 'cancel') {
      const pending = await cancelScheduledAccountDeletion({
        supabaseAdmin,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        mode: 'cancel',
        account_deletion_requested_at: pending?.account_deletion_requested_at || null,
        account_deletion_scheduled_for: pending?.account_deletion_scheduled_for || null,
      });
    }

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type DELETE MY ACCOUNT to confirm.' },
        { status: 400 }
      );
    }

    if (typedEmail !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Please enter your current email address to confirm.' },
        { status: 400 }
      );
    }

    if (mode === 'scheduled') {
      const pending = await scheduleAccountDeletion({
        supabaseAdmin,
        userId: user.id,
        days: 7,
      });

      return NextResponse.json({
        success: true,
        mode: 'scheduled',
        account_deletion_requested_at: pending?.account_deletion_requested_at || null,
        account_deletion_scheduled_for: pending?.account_deletion_scheduled_for || null,
      });
    }

    const result = await deleteAccountData({
      supabaseAdmin,
      stripe,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      mode: 'immediate',
      ...result,
    });
  } catch (error) {
    console.error('[Account Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
