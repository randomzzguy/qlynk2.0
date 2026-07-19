import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeAuthRedirect } from '@/lib/auth-redirect';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeAuthRedirect(requestUrl.searchParams.get('next'));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Check if this user has completed onboarding
      await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single();

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Fallback - send to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', requestUrl.origin));
}
