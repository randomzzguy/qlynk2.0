'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase';
import { CreditCard, Zap, Check, ArrowRight, Loader2, Clock, FileText, Download, Receipt } from 'lucide-react';
import { getTrialDaysRemaining, isTrialExpired, PLAN_LIMITS } from '@/lib/subscriptionHelpers';

export default function BillingPage() {
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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

        // Load invoices
        setLoadingInvoices(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const invRes = await fetch('/api/invoices', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (invRes.ok) {
            const invData = await invRes.json();
            setInvoices(invData.invoices || []);
          }
        }
        setLoadingInvoices(false);
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

  const tier = subscription?.tier || 'trial';
  const isTrial = tier.toLowerCase() === 'trial';
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
                <h2 className="text-2xl font-black text-white capitalize">{tier} Plan</h2>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-gray-300">
                <Check className="text-green-500" size={18} />
                <span>{messagesLimit.toLocaleString()} Monthly Messages</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Check className="text-green-500" size={18} />
                <span>Priority Qlynk Agent AI</span>
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
                <p className="text-white font-bold">{getTrialDaysRemaining(subscription?.trial_ends_at)} days left</p>
                <p className="text-gray-400">in your free trial</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-8 mb-20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-blue-400" />
          Invoice History
        </h3>
        
        {loadingInvoices ? (
          <div className="flex items-center justify-center py-10 bg-white/5 rounded-2xl border border-white/10">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
            <FileText className="mx-auto mb-3 text-gray-600" size={32} />
            <p className="text-gray-400 text-sm">No invoices yet</p>
            <p className="text-gray-600 text-xs mt-1">
              {isTrial ? 'Upgrade to see your billing history' : 'Invoices will appear here after your first payment'}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">
                        {new Date(inv.date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {inv.description}
                        <p className="text-xs text-gray-500 mt-0.5">{inv.number}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        ${inv.amount.toFixed(2)} {inv.currency}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'paid' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                            : inv.status === 'open'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.pdfUrl && (
                          <a 
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
          <Link
            href="/pricing"
            className="px-8 py-4 bg-orange text-white rounded-2xl font-black flex items-center gap-3 hover:bg-orange/90 transition-all active:scale-95 whitespace-nowrap"
          >
            Compare Plans
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
