import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { trialExpiringEmail } from '@/lib/email/templates/trial-expiring';
import { trialExpiredEmail } from '@/lib/email/templates/trial-expired';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { buildEmailPreferencesUrl } from '@/lib/email/preferences';

async function getTrialEmailPreference(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('notif_trial_expiry')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.notif_trial_expiry !== false;
}

async function markTrialWarningHandled(supabase, userId) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ trial_warning_sent: true })
    .eq('user_id', userId)
    .eq('tier', 'trial')
    .eq('status', 'trialing');
  if (error) throw error;
}

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
      .eq('status', 'trialing')
      .lt('trial_ends_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    // Move expired trials into the schema's supported non-live status. This must
    // happen before email so a delivery failure cannot select the trial again.
    let updated = 0;
    let emailsSent = 0;
    for (const trial of expiredTrials || []) {
      const { data: updatedSubscriptions, error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', trial.user_id)
        .eq('tier', 'trial')
        .eq('status', 'trialing')
        .select('user_id');
      if (updateError) throw updateError;
      if (!updatedSubscriptions?.length) continue;
      updated++;

      // Settle the subscription before attempting email, so a provider failure
      // can never cause the same expired trial to be processed every day.
      const notificationEnabled = await getTrialEmailPreference(supabase, trial.user_id);
      if (!notificationEnabled) continue;

      const { data: authUser } = await supabase.auth.admin.getUserById(trial.user_id);
      const userEmail = authUser?.user?.email;
      const username = authUser?.user?.user_metadata?.username || 'there';
      if (userEmail) {
        const { success } = await sendEmail({
          to: userEmail,
          ...trialExpiredEmail({
            username,
            preferencesUrl: buildEmailPreferencesUrl(trial.user_id, 'trial_expiry'),
          }),
          idempotencyKey: `trial-expired-${trial.user_id}-${trial.trial_ends_at}`,
        });
        if (success) emailsSent++;
      }
    }

    // Find trials expiring in exactly 3 days and send a warning email
    const now = new Date();
    const in3DaysStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    in3DaysStart.setHours(0, 0, 0, 0);
    const in3DaysEnd = new Date(in3DaysStart.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringIn3Days, error: warningFetchError } = await supabase
      .from('subscriptions')
      .select('user_id, trial_ends_at')
      .eq('tier', 'trial')
      .eq('status', 'trialing')
      .eq('trial_warning_sent', false)
      .gte('trial_ends_at', in3DaysStart.toISOString())
      .lt('trial_ends_at', in3DaysEnd.toISOString());
    if (warningFetchError) throw warningFetchError;

    let warningsSent = 0;
    for (const trial of expiringIn3Days || []) {
      const notificationEnabled = await getTrialEmailPreference(supabase, trial.user_id);
      if (!notificationEnabled) {
        await markTrialWarningHandled(supabase, trial.user_id);
        continue;
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(trial.user_id);
      const userEmail = authUser?.user?.email;
      const username = authUser?.user?.user_metadata?.username || 'there';
      if (userEmail) {
        const { success } = await sendEmail({
          to: userEmail,
          ...trialExpiringEmail({
            username,
            daysLeft: 3,
            preferencesUrl: buildEmailPreferencesUrl(trial.user_id, 'trial_expiry'),
          }),
          idempotencyKey: `trial-warning-${trial.user_id}-${trial.trial_ends_at}`,
        });
        if (success) {
          warningsSent++;
          await markTrialWarningHandled(supabase, trial.user_id);
        }
      } else {
        await markTrialWarningHandled(supabase, trial.user_id);
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
