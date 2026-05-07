import { createClientBrowser } from '@/lib/supabase';

/**
 * Check if an agent is currently live based on subscription status
 * Agent is live when:
 * 1. is_enabled is true
 * 2. Either:
 *    - Trial is still active (trial_ends_at > NOW)
 *    - OR subscription tier is 'pro' or 'business' and status is 'active'
 */
export async function isAgentLive(userId) {
  try {
    const supabase = createClientBrowser();

    // Get agent config
    const { data: agentConfig, error: agentError } = await supabase
      .from('agent_configs')
      .select('is_enabled')
      .eq('user_id', userId)
      .single();

    if (agentError || !agentConfig?.is_enabled) {
      return false;
    }

    // Get subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status, trial_ends_at')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return false;
    }

    // Check if trial is still active
    if (subscription.tier === 'trial') {
      const trialEndsAt = new Date(subscription.trial_ends_at);
      return trialEndsAt > new Date();
    }

    // Check if paid subscription is active
    if (subscription.tier === 'pro' || subscription.tier === 'business') {
      return subscription.status === 'active';
    }

    return false;
  } catch (error) {
    console.error('Error checking agent live status:', error);
    return false;
  }
}

/**
 * Get agent config with subscription info
 */
export async function getAgentWithSubscription(userId) {
  try {
    const supabase = createClientBrowser();

    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { agentConfig, subscription };
  } catch (error) {
    console.error('Error fetching agent with subscription:', error);
    return { agentConfig: null, subscription: null };
  }
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(trialEndsAt) {
  return new Date(trialEndsAt) <= new Date();
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt) {
  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}
