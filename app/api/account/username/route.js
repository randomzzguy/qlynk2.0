import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { getUsernameChangeAvailability, validateUsername } from '@/lib/usernames';

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'account-username-change', 10, 60 * 1000);
  if (limited) return limited;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validation = validateUsername(body?.username);
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('username, username_changed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Unable to load your current Qlynk URL.' }, { status: 500 });
  }

  if (profile.username?.toLowerCase() === validation.username) {
    return NextResponse.json({ error: 'Choose a username different from your current one.' }, { status: 400 });
  }

  const availability = getUsernameChangeAvailability(profile.username_changed_at);
  if (!availability.canChange) {
    return NextResponse.json({
      error: 'Your username can only be changed once every 30 days.',
      code: 'USERNAME_COOLDOWN',
      usernameChangedAt: profile.username_changed_at,
      nextChangeAt: availability.nextChangeAt,
    }, { status: 409 });
  }

  const { data: updated, error: updateError } = await admin
    .from('profiles')
    .update({ username: validation.username })
    .eq('id', user.id)
    .select('username, username_changed_at')
    .single();

  if (updateError) {
    if (updateError.code === '23505') {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    if (String(updateError.message || '').includes('once every 30 days')) {
      const latest = await admin
        .from('profiles')
        .select('username_changed_at')
        .eq('id', user.id)
        .maybeSingle();
      const latestAvailability = getUsernameChangeAvailability(latest.data?.username_changed_at);
      return NextResponse.json({
        error: 'Your username can only be changed once every 30 days.',
        code: 'USERNAME_COOLDOWN',
        usernameChangedAt: latest.data?.username_changed_at || null,
        nextChangeAt: latestAvailability.nextChangeAt,
      }, { status: 409 });
    }

    console.error('[Username Change] Update failed:', updateError.message);
    return NextResponse.json({ error: 'Unable to change your Qlynk URL. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    username: updated.username,
    usernameChangedAt: updated.username_changed_at,
    nextChangeAt: getUsernameChangeAvailability(updated.username_changed_at).nextChangeAt,
  });
}
