'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase';
import { CreditCard, Zap, Check, ArrowRight, Loader2, Clock } from 'lucide-react';
import { getTrialDaysRemaining, isTrialExpired, PLAN_LIMITS } from '@/lib/subscriptionHelpers';

export default function BillingPage() {
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const userProfile = await getCurrentProfile();
        setProfile(userProfile);

        const supabase = createClient();
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setSubscription(sub);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // If no portal (e.g. no stripe customer yet), go to pricing
        window.location.href = '/pricing';
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange animate-spin" />
      </div>
    );
  }

  const tier = subscription?.tier || 'Trial';
  const isTrial = tier === 'Trial';
  const messagesUsed = subscription?.messages_used || 0;
  const messagesLimit = PLAN_LIMITS[tier.toLowerCase()] || 1000;
  const usagePercent = Math.min(100, (messagesUsed / messagesLimit) * 100);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">Manage your plan and usage</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Current Plan Card */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CreditCard size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-orange">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Current Plan</p>
                <h2 className="text-2xl font-black text-white">{tier} Plan</h2>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-gray-300">
                <Check className="text-green-500" size={18} />
                <span>{messagesLimit.toLocaleString()} Monthly Messages</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Check className="text-green-500" size={18} />
                <span>Priority q-agent AI</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Check className="text-green-500" size={18} />
                <span>Custom Knowledge Base</span>
              </div>
            </div>

            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black flex items-center gap-3 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
              {isTrial ? 'Upgrade to Pro' : 'Manage Subscription'}
            </button>
          </div>
        </div>

        {/* Usage Card */}
        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-6">Usage This Month</p>
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-white">{messagesUsed}</span>
                <span className="text-gray-500 font-bold">/ {messagesLimit >= 1000000 ? 'Unlimited' : messagesLimit}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange transition-all duration-1000" 
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Resetting in {30 - new Date().getDate()} days
            </p>
          </div>

          {isTrial && (
            <div className="mt-8 p-4 rounded-2xl bg-orange/10 border border-orange/20 flex items-center gap-3">
              <Clock className="text-orange" size={20} />
              <div className="text-xs">
                <p className="text-white font-bold">{getTrialDaysRemaining(subscription?.created_at)} days left</p>
                <p className="text-gray-400">in your free trial</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plans Section */}
      <div className="p-8 rounded-3xl border border-orange/20 bg-orange/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange flex items-center justify-center text-white shadow-xl shadow-orange/20">
              <Zap size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Unlock Full Potential</h3>
              <p className="text-gray-400">Upgrade to Pro for unlimited messages and advanced features.</p>
            </div>
          </div>
          <a 
            href="/pricing"
            className="px-8 py-4 bg-orange text-white rounded-2xl font-black flex items-center gap-3 hover:bg-orange/90 transition-all active:scale-95 whitespace-nowrap"
          >
            Compare Plans
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </div>
  );
}
