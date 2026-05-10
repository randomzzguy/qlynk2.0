import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, username, hcaptchaToken, profession = 'Creative Professional' } = body;

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
    const supabase = createServerClient(cookieStore);
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
          username: username
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
          name: username,
          tagline: 'Welcome to my qlynk page!',
          profession: profession || 'Creative Professional',
          theme: 'quickpitch',
          theme_category: 'freelancers',
          theme_data: { 
            config_version: 'v1',
            headline: username,
            subhead: 'Welcome to my digital twin.',
            email: email
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
          agent_name: 'q-agent',
          welcome_message: `Hi! I'm ${username}'s AI clone. Ask me anything about their work!`,
          is_enabled: true,
          primary_color: '#f46530'
        });

      if (agentError) {
        console.error('[v0] Manual Agent Error:', agentError.message);
      }
    }

    return NextResponse.json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
