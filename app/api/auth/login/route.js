import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rateLimitResponse } from '@/lib/rate-limit';
import { verifyHCaptchaToken } from '@/lib/hcaptcha';

export async function POST(request) {
  // Rate limit: 5 requests per 15 minutes per IP
  const rateLimit = rateLimitResponse(request, 'auth-login', 5, 15 * 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { email, password, hcaptchaToken } = body;

        const captchaResult = await verifyHCaptchaToken(hcaptchaToken);
        if (!captchaResult.ok) {
            return NextResponse.json(
                { message: captchaResult.message },
                { status: captchaResult.status }
            );
        }

        // Proceed with login
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.info('[Auth] Login completed:', { success: !error });

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
