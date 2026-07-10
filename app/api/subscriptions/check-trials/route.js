import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { trialExpiringEmail } from '@/lib/email/templates/trial-expiring';
import { trialExpiredEmail } from '@/lib/email/templates/trial-expired';
import { authorizeCronRequest } from '@/lib/cron-auth';

/**
 * Check all trial expirations and handle accordingly
 * This endpoint should be called periodically (e.g., via a cron job)
 */
export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;

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

    // For each expired trial, mark agents as offline, flip tier to 'expired', and send email
    let updated = 0;
    let emailsSent = 0;
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

      // Flip tier to 'expired' so this user is never picked up by this cron again
      await supabase
        .from('subscriptions')
        .update({ tier: 'expired' })
        .eq('user_id', trial.user_id);

      // Send trial expired email
      const { data: authUser } = await supabase.auth.admin.getUserById(trial.user_id);
      const userEmail = authUser?.user?.email;
      const username = authUser?.user?.user_metadata?.username || 'there';
      if (userEmail) {
        const { success } = await sendEmail({
          to: userEmail,
          ...trialExpiredEmail({ username }),
        });
        if (success) emailsSent++;
      }
    }

    // Find trials expiring in exactly 3 days and send a warning email
    const now = new Date();
    const in3DaysStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    in3DaysStart.setHours(0, 0, 0, 0);
    const in3DaysEnd = new Date(in3DaysStart.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringIn3Days } = await supabase
      .from('subscriptions')
      .select('user_id, trial_ends_at')
      .eq('tier', 'trial')
      .eq('trial_warning_sent', false)
      .gte('trial_ends_at', in3DaysStart.toISOString())
      .lt('trial_ends_at', in3DaysEnd.toISOString());

    let warningsSent = 0;
    for (const trial of expiringIn3Days || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(trial.user_id);
      const userEmail = authUser?.user?.email;
      const username = authUser?.user?.user_metadata?.username || 'there';
      if (userEmail) {
        const { success } = await sendEmail({
          to: userEmail,
          ...trialExpiringEmail({ username, daysLeft: 3 }),
        });
        if (success) {
          warningsSent++;
          // Mark as warned so this user is skipped on future cron runs
          await supabase
            .from('subscriptions')
            .update({ trial_warning_sent: true })
            .eq('user_id', trial.user_id);
        }
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} expired agents, sent ${emailsSent} expiry emails, sent ${warningsSent} 3-day warning emails`,
      expiredCount: expiredTrials?.length || 0,
      expiringIn3DaysCount: expiringIn3Days?.length || 0,
    });
  } catch (error) {
    console.error('Error checking trial expirations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
