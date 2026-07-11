import { createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/i;
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/track-view
 * Body: { username: string, visitor_id: string, referrer?: string }
 * 
 * Resolves the username → user_id then inserts a page_view row.
 * No authentication required — this is public tracking.
 */
export async function POST(request) {
  const rateLimit = await rateLimitResponse(request, 'track-view', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const { username, visitor_id, referrer } = await request.json();

    if (!USERNAME_PATTERN.test(username || '') || !VISITOR_ID_PATTERN.test(visitor_id || '')) {
      return NextResponse.json({ error: 'Invalid tracking fields' }, { status: 400 });
    }

    let safeReferrer = null;
    if (typeof referrer === 'string' && referrer.length <= 2_048) {
      try {
        const parsedReferrer = new URL(referrer);
        if (['http:', 'https:'].includes(parsedReferrer.protocol)) {
          safeReferrer = parsedReferrer.toString();
        }
      } catch {
        // Invalid referrers are discarded rather than blocking analytics.
      }
    }

    const supabase = createAdminClient();

    // Resolve username → user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingView } = await supabase
      .from('page_views')
      .select('id')
      .eq('page_owner_id', profile.id)
      .eq('visitor_id', visitor_id)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (existingView) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    const { error: insertError } = await supabase
      .from('page_views')
      .insert({
        page_owner_id: profile.id,
        visitor_id,
        referrer: safeReferrer,
      });

    if (insertError) {
      console.error('[track-view] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track-view] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
