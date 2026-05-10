import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * POST /api/track-view
 * Body: { username: string, visitor_id: string, referrer?: string }
 * 
 * Resolves the username → user_id then inserts a page_view row.
 * No authentication required — this is public tracking.
 */
export async function POST(request) {
  try {
    const { username, visitor_id, referrer } = await request.json();

    if (!username || !visitor_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Resolve username → user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Insert the view — intentionally fire-and-forget friendly (no error surfaced to visitor)
    const { error: insertError } = await supabase
      .from('page_views')
      .insert({
        page_owner_id: profile.id,
        visitor_id,
        referrer: referrer || null,
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
