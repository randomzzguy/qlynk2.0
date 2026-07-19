import { createAdminClient, createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rateLimitResponse } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates/welcome';
import { buildEmailPreferencesUrl } from '@/lib/email/preferences';
import { verifyHCaptchaToken } from '@/lib/hcaptcha';
import { authEmailExists, isDuplicateSignupResult } from '@/lib/signup-availability';

const EMAIL_ALREADY_EXISTS_MESSAGE = 'An account with this email already exists. Please log in or use a different email.';
const USERNAME_ALREADY_EXISTS_MESSAGE = 'This username is already taken. Please choose a different username.';

async function rollbackIncompleteSignup(supabaseAdmin, userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('[Auth] Failed to roll back incomplete signup:', error.message);
  }
}

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

    // Supabase deliberately obscures duplicate email signups when email confirmation is enabled.
    // Check the authoritative Auth user list on the server before requesting a new signup email.
    const supabaseAdmin = createAdminClient();
    const emailLookup = await authEmailExists(supabaseAdmin, normalizedEmail);

    if (emailLookup.error) {
      console.error('[Auth] Could not verify email availability:', emailLookup.error.message);
      return NextResponse.json(
        { message: 'We could not verify email availability. Please try again.' },
        { status: 503 }
      );
    }

    if (emailLookup.exists) {
      console.info('[Auth] Signup rejected because the email is already registered.');
      return NextResponse.json({ message: EMAIL_ALREADY_EXISTS_MESSAGE }, { status: 409 });
    }

    const { count: usernameCount, error: usernameLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', normalizedUsername);

    if (usernameLookupError) {
      console.error('[Auth] Could not verify username availability:', usernameLookupError.message);
      return NextResponse.json(
        { message: 'We could not verify username availability. Please try again.' },
        { status: 503 }
      );
    }

    if ((usernameCount || 0) > 0) {
      console.info('[Auth] Signup rejected because the username is already registered.');
      return NextResponse.json({ message: USERNAME_ALREADY_EXISTS_MESSAGE }, { status: 409 });
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

    // Defense in depth for a concurrent signup or Supabase's masked duplicate response.
    if (isDuplicateSignupResult(signUpData, error)) {
      console.info('[Auth] Signup rejected after Supabase reported a duplicate email.');
      return NextResponse.json({ message: EMAIL_ALREADY_EXISTS_MESSAGE }, { status: 409 });
    }

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!signUpData?.user) {
      console.error('[Auth] Signup returned no user and no explicit error.');
      return NextResponse.json({ message: 'Account setup failed. Please try again.' }, { status: 500 });
    }

    // MANUALLY create the profile and subscription using the Admin client
    // This bypasses the need for database triggers which are currently failing
    if (signUpData.user) {
      console.log('[v0] Manually creating records for user:', signUpData.user.id);

      // Create Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          username: normalizedUsername,
          email: normalizedEmail,
        });

      if (profileError) {
        console.error('[v0] Manual Profile Error:', profileError.message);
        await rollbackIncompleteSignup(supabaseAdmin, signUpData.user.id);
        const isUniqueConflict = profileError.code === '23505';
        return NextResponse.json(
          { message: isUniqueConflict ? USERNAME_ALREADY_EXISTS_MESSAGE : 'Account setup failed. Please try again.' },
          { status: isUniqueConflict ? 409 : 500 }
        );
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
        await rollbackIncompleteSignup(supabaseAdmin, signUpData.user.id);
        return NextResponse.json({ message: 'Account setup failed. Please try again.' }, { status: 500 });
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
        await rollbackIncompleteSignup(supabaseAdmin, signUpData.user.id);
        return NextResponse.json({ message: 'Account setup failed. Please try again.' }, { status: 500 });
      }

      // Create Default Agent Config
      const { error: agentError } = await supabaseAdmin
        .from('agent_configs')
        .insert({
          user_id: signUpData.user.id,
          agent_name: 'Your AI',
          welcome_message: `Hi! I'm ${normalizedUsername}'s Qlynk Agent. Ask me anything within my configured knowledge and purpose!`,
          is_enabled: true,
          primary_color: '#f46530'
        });

      if (agentError) {
        console.error('[v0] Manual Agent Error:', agentError.message);
        await rollbackIncompleteSignup(supabaseAdmin, signUpData.user.id);
        return NextResponse.json({ message: 'Account setup failed. Please try again.' }, { status: 500 });
      }
    }

    // Send welcome email (fire-and-forget — don't block signup response)
    sendEmail({
      to: normalizedEmail,
      ...welcomeEmail({
        username: normalizedUsername,
        preferencesUrl: buildEmailPreferencesUrl(signUpData.user.id, 'all'),
      }),
      idempotencyKey: `welcome-${signUpData.user.id}`,
    }).catch((err) =>
      console.error('[Signup] Welcome email failed:', err)
    );

    return NextResponse.json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
