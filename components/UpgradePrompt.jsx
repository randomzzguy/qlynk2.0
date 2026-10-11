'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getEffectiveTier, isSubscriptionLive } from '@/lib/plans';

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

  if (isSubscriptionLive(subscription) && getEffectiveTier(subscription) === 'creator') {
    return (
      <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-5 mb-8 relative group">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
          <Zap className="text-emerald-500" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">Creator is free. Upgrade when you need more.</h3>
          <p className="text-emerald-200/70 text-sm mb-4 leading-relaxed">
            Stay on Creator at no cost, or choose Agency for 10,000 messages per month and removal of the “Powered by Qlynk” label.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Explore Agency
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
