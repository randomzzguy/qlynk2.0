import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rateLimitResponse } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates/welcome';
import { verifyHCaptchaToken } from '@/lib/hcaptcha';

export async function POST(request) {
  // Rate limit: 3 requests per 15 minutes per IP
  const rateLimit = await rateLimitResponse(request, 'auth-signup', 3, 15 * 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { email, password, username, hcaptchaToken, profession = 'Creative Professional' } = body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const normalizedProfession = typeof profession === 'string' ? profession.trim() : '';
    const reservedUsernames = new Set([
      'admin', 'api', 'auth', 'dashboard', 'embed', 'login', 'signup',
      'account', 'settings', 'support', 'help', 'pricing', 'www',
    ]);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(normalizedUsername) || reservedUsernames.has(normalizedUsername)) {
      return NextResponse.json(
        { message: 'Username must be 3-30 characters, use only letters, numbers, hyphens, or underscores, and cannot be reserved.' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ message: 'Password must be between 8 and 128 characters.' }, { status: 400 });
    }

    if (!normalizedProfession || normalizedProfession.length > 100) {
      return NextResponse.json({ message: 'Profession must be between 1 and 100 characters.' }, { status: 400 });
    }

    const captchaResult = await verifyHCaptchaToken(hcaptchaToken);
    if (!captchaResult.ok) {
      return NextResponse.json(
        { message: captchaResult.message },
        { status: captchaResult.status }
      );
    }

    // Proceed with signup
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    console.info('[Auth] Signup attempt received.');
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    console.info('[Auth] Signup completed:', { success: !error, errorCode: error?.code });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // MANUALLY create the profile and subscription using the Admin client
    // This bypasses the need for database triggers which are currently failing
    if (signUpData?.user) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      console.log('[v0] Manually creating records for user:', signUpData.user.id);

      // Create Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          username: normalizedUsername
        });

      if (profileError) {
        console.error('[v0] Manual Profile Error:', profileError.message);
      }

      // Create Subscription
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: signUpData.user.id,
          tier: 'trial',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) {
        console.error('[v0] Manual Subscription Error:', subError.message);
      }

      // Create Default Page (so URL works immediately)
      const { error: pageError } = await supabaseAdmin
        .from('pages')
        .insert({
          user_id: signUpData.user.id,
          name: normalizedUsername,
          tagline: 'Welcome to my qlynk page!',
          profession: normalizedProfession,
          theme: 'quickpitch',
          theme_category: 'freelancers',
          theme_data: { 
            config_version: 'v1',
            headline: normalizedUsername,
            subhead: 'Welcome to my digital twin.',
            email: normalizedEmail
          },
          is_published: true
        });

      if (pageError) {
        console.error('[v0] Manual Page Error:', pageError.message);
      }

      // Create Default Agent Config
      const { error: agentError } = await supabaseAdmin
        .from('agent_configs')
        .insert({
          user_id: signUpData.user.id,
          agent_name: 'Your AI',
          welcome_message: `Hi! I'm ${normalizedUsername}'s AI clone. Ask me anything about their work!`,
          is_enabled: true,
          primary_color: '#f46530'
        });

      if (agentError) {
        console.error('[v0] Manual Agent Error:', agentError.message);
      }
    }

    // Send welcome email (fire-and-forget — don't block signup response)
    sendEmail({ to: normalizedEmail, ...welcomeEmail({ username: normalizedUsername }) }).catch((err) =>
      console.error('[Signup] Welcome email failed:', err)
    );

    return NextResponse.json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
