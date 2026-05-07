import { createClient } from '@supabase/supabase-js';

/**
 * Check all trial expirations and handle accordingly
 * This endpoint should be called periodically (e.g., via a cron job)
 */
export async function GET(request) {
  // Verify the request is coming from a trusted source (e.g., cron job)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate environment variables only when the function runs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find all trial subscriptions that have expired
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, trial_ends_at')
      .eq('tier', 'trial')
      .lt('trial_ends_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    // For each expired trial, mark agents as offline (is_published = false)
    let updated = 0;
    for (const trial of expiredTrials || []) {
      const { error: updateError } = await supabase
        .from('agent_configs')
        .update({ is_published: false })
        .eq('user_id', trial.user_id);

      if (updateError) {
        console.error(`Error updating agent for user ${trial.user_id}:`, updateError);
      } else {
        updated++;
      }
    }

    // Also send email notifications to users whose trials expired today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const { data: todaysExpiries } = await supabase
      .from('subscriptions')
      .select('user_id, trial_ends_at')
      .eq('tier', 'trial')
      .gte('trial_ends_at', startOfDay.toISOString())
      .lt('trial_ends_at', endOfDay.toISOString());

    // You can add email sending here (e.g., using SendGrid, Resend, etc.)
    // Example: await sendTrialExpiredEmail(user.email)

    return Response.json({
      success: true,
      message: `Updated ${updated} expired agents, found ${todaysExpiries?.length || 0} expiring today`,
      expiredCount: expiredTrials?.length || 0,
      expiringTodayCount: todaysExpiries?.length || 0,
    });
  } catch (error) {
    console.error('Error checking trial expirations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
