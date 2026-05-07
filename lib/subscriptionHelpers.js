import { createClientBrowser } from '@/lib/supabase';

export const PLAN_LIMITS = {
  trial: 1000,
  creator: 5000,
  agency: 10000,
};

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

/**
 * Check if a user can send another message based on their plan
 */
export async function canSendMessage(userId) {
  try {
    const supabase = createClientBrowser();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, messages_used')
      .eq('user_id', userId)
      .single();
    
    if (!subscription) return false;
    
    const limit = PLAN_LIMITS[subscription.tier.toLowerCase()] || 0;
    return (subscription.messages_used || 0) < limit;
  } catch (error) {
    console.error('Error checking message limit:', error);
    return false;
  }
}

/**
 * Increment usage for a user
 */
export async function incrementUsage(userId) {
  try {
    const supabase = createClientBrowser();
    
    // Using a RPC or a direct update with increment
    // Since Supabase doesn't have a built-in increment without RPC, we'll do it in two steps or a raw update if possible
    // But for a robust way, let's use a simple update for now or assume a RPC 'increment_messages' exists
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('messages_used')
      .eq('user_id', userId)
      .single();
      
    await supabase
      .from('subscriptions')
      .update({ messages_used: (subscription?.messages_used || 0) + 1 })
      .eq('user_id', userId);
      
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}
