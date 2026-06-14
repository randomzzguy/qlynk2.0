import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request) {
  // Rate limit: 5 requests per 15 minutes per IP
  const rateLimit = rateLimitResponse(request, 'auth-login', 5, 15 * 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { email, password, hcaptchaToken } = body;
    console.log('[API] Login attempt received:', { email, hcaptchaToken });

        // Verify hCaptcha token
        const secret = process.env.HCAPTCHA_SECRET_KEY || process.env.HCAPTCHA_SECRET;
        const isLocalBypass = hcaptchaToken === 'local-bypass';

        if (!isLocalBypass) {
            if (!secret) {
                console.warn('hCaptcha secret is missing, but hcaptchaToken provided. Bypassing verification.');
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

        // Proceed with login
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                captchaToken: hcaptchaToken === 'local-bypass' ? undefined : hcaptchaToken,
            },
        });
        console.log('[API] Supabase login result:', { success: !error, error: error?.message });

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }

        // Check onboarding status
        const { data: { user } } = await supabase.auth.getUser();
        let redirectTo = '/dashboard';
        
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single();
            
            if (!profile?.onboarding_completed) {
                redirectTo = '/onboarding';
            }
        }

        return NextResponse.json({ message: 'Login successful', redirectTo });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}
