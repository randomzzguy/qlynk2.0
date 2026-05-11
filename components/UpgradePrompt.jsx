'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Zap, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getTrialDaysRemaining, isTrialExpired } from '@/lib/subscriptionHelpers';

export default function UpgradePrompt() {
  const [subscription, setSubscription] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setSubscription(sub);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading || dismissed || !subscription) {
    return null;
  }

  // Show trial expiring soon
  if (subscription.tier === 'trial' && !isTrialExpired(subscription.trial_ends_at)) {
    const daysLeft = getTrialDaysRemaining(subscription.trial_ends_at);
    if (daysLeft <= 3) {
      return (
        <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 flex items-start gap-5 mb-8 relative group">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
            <Clock className="text-amber-500" size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Trial Ending Soon</h3>
            <p className="text-amber-200/70 text-sm mb-4 leading-relaxed">
              You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} left on your free trial. Upgrade now to keep your agent live and maintain your presence.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              View Plans
              <Zap size={14} />
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500/50 hover:text-amber-500 p-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      );
    }
  }

  // Show trial expired or paused
  if ((subscription.tier === 'trial' && isTrialExpired(subscription.trial_ends_at)) || subscription.status === 'paused') {
    const isPaused = subscription.status === 'paused';
    const choice = subscription.post_trial_choice || 'pause';
    
    return (
      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-5 flex items-start gap-5 mb-8 relative group">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0 border border-red-500/20">
          <AlertCircle className="text-red-500" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">{isPaused ? 'Account Paused' : 'Trial Expired'}</h3>
          <p className="text-red-200/70 text-sm mb-4 leading-relaxed">
            {isPaused 
              ? 'Your account is currently on hold. Your agent is offline, but your data is safe for 14 days. Upgrade now to go back live.' 
              : `Your trial has ended. You chose the ${choice} plan. Please complete your upgrade to bring your agent back online.`}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20"
          >
            Upgrade Now
            <Zap size={14} />
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-500/50 hover:text-red-500 p-2 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  // Show upsell for free tier
  if (subscription.tier === 'pro' && subscription.status === 'active') {
    return (
      <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-5 mb-8 relative group">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
          <Zap className="text-emerald-500" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">Ready to Scale?</h3>
          <p className="text-emerald-200/70 text-sm mb-4 leading-relaxed">
            Upgrade to the Agency plan to unlock 10,000 messages/month, white-label options, and more agents.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Scale Now
            <ArrowRight size={14} />
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-500/50 hover:text-emerald-500 p-2 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return null;
}
