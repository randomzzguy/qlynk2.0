import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { verifyHCaptchaToken } from '@/lib/hcaptcha';

const GENERIC_RESET_MESSAGE = 'If an account exists for that email, a password reset link is on its way.';

export async function POST(request) {
  const rateLimit = await rateLimitResponse(request, 'auth-password-reset', 3, 15 * 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const { email, hcaptchaToken } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    const captchaResult = await verifyHCaptchaToken(hcaptchaToken);
    if (!captchaResult.ok) {
      return NextResponse.json({ message: captchaResult.message }, { status: captchaResult.status });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const redirectTo = new URL('/auth/callback?next=/auth/update-password', siteOrigin).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

    if (error) {
      console.error('[Auth] Password reset request failed:', error.message);
    }

    // Always return the same response so this endpoint cannot enumerate accounts.
    return NextResponse.json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('[Auth] Password reset request error:', error);
    return NextResponse.json({ message: GENERIC_RESET_MESSAGE });
  }
}
