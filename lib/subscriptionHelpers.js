import { createClientBrowser } from '@/lib/supabase';
import { getMessageLimit, getEffectiveTier, getCurrentMessagesUsed, isSubscriptionLive, PLAN_LIMITS } from '@/lib/plans';

export { PLAN_LIMITS };

/**
 * Check if an agent is currently live based on subscription status
 * Agent is live when:
 * 1. is_enabled is true
 * 2. A recognized subscription is present and is not explicitly paused.
 *    Ended trials and paid subscriptions retain free Creator access.
 */
export async function isAgentLive(userId, providedSupabase = null) {
  try {
    const supabase = providedSupabase || createClientBrowser();

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
      .select('tier, status, trial_ends_at, post_trial_choice')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return false;
    }

    return isSubscriptionLive(subscription);
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

/**
 * Check if a user can send another message based on their plan
 */
export async function canSendMessage(userId) {
  try {
    const supabase = createClientBrowser();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status, messages_used, last_reset_at, created_at')
      .eq('user_id', userId)
      .single();
    
    if (!isSubscriptionLive(subscription)) return false;
    
    const limit = getMessageLimit(getEffectiveTier(subscription));
    return getCurrentMessagesUsed(subscription) < limit;
  } catch (error) {
    console.error('Error checking message limit:', error);
    return false;
  }
}
