
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Check if this user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single();

      // New users or users who haven't completed onboarding go to onboarding
      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }

      // Existing users go to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
  }

  // Fallback - send to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', requestUrl.origin));
}
