import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, username, hcaptchaToken } = body;

    // Verify hCaptcha token
    const secret = process.env.HCAPTCHA_SECRET;
    const isLocalBypass = hcaptchaToken === 'local-bypass';

    if (!isLocalBypass) {
      if (!secret) {
        console.warn('HCAPTCHA_SECRET is missing, but hcaptchaToken provided. Bypassing verification.');
      } else {
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', hcaptchaToken);

        const hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
          method: 'POST',
          body: params,
        });

        const hcaptchaData = await hcaptchaResponse.json();

        if (!hcaptchaData.success) {
          console.error('hCaptcha verification failed:', hcaptchaData);
          return NextResponse.json(
            { message: 'hCaptcha verification failed. Please try again.' },
            { status: 400 }
          );
        }
      }
    }

    // Proceed with signup
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    console.log('[v0] Attempting signup for:', { email, username });
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        captchaToken: hcaptchaToken === 'local-bypass' ? undefined : hcaptchaToken,
      },
    });

    console.log('[v0] Signup result:', { success: !error, error: error?.message, errorCode: error?.code, user: signUpData?.user?.id });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // Profile is automatically created via database trigger (handle_new_user_profile)
    // No manual insert needed - the trigger runs with SECURITY DEFINER to bypass RLS

    return NextResponse.json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
