import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('agent_access_credentials')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Agent Password] Failed to read credential status:', error.message);
    return NextResponse.json({ error: 'Unable to read password status' }, { status: 500 });
  }

  return NextResponse.json({ passwordSet: Boolean(data) });
}

export async function POST(request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < 6 || password.length > 200) {
    return NextResponse.json(
      { error: 'Access password must be between 6 and 200 characters' },
      { status: 400 }
    );
  }

  const passwordHash = await hash(password, 12);
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('agent_access_credentials')
    .upsert({
      user_id: user.id,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('[Agent Password] Failed to store credential:', error.message);
    return NextResponse.json({ error: 'Unable to save access password' }, { status: 500 });
  }

  return NextResponse.json({ passwordSet: true });
}
