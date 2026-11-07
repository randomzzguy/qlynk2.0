'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { DashboardPage as PageFrame, PageHeader, DASHBOARD_CARD, DASHBOARD_BUTTON_PRIMARY, DASHBOARD_BUTTON_SECONDARY } from '@/components/dashboard/PageShell';
import { getEffectiveTier, getMessageLimit, getCurrentMessagesUsed } from '@/lib/plans';
import UpgradePrompt from '@/components/UpgradePrompt';
import TrialChoiceManager from '@/components/TrialChoiceManager';
import { announceDashboardTourCheckoutState } from '@/lib/dashboard-tour';
import { useDashboardPageReady } from '@/lib/dashboard-page-ready';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [agentConfig, setAgentConfig] = useState(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    messagesThisWeek: 0,
    avgMessagesPerConvo: 0,
    messagesUsed: 0,
    messagesLimit: 0,
    tier: 'creator'
  });
  const [recentConversations, setRecentConversations] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [readinessData, setReadinessData] = useState({ knowledgeCount: 0, openGaps: 0, rules: null });
  const isPaymentPastDue = ['past_due', 'unpaid'].includes(subscription?.status?.toLowerCase());
  const isAccountDeletionScheduled = !!profile?.account_deletion_scheduled_for;
  useDashboardPageReady(loading);

  const loadDashboardData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const supabase = createClient();
      const userProfilePromise = getCurrentProfile(user);
      const configPromise = supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      const readinessPromise = Promise.all([
        supabase.from('agent_knowledge').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('agent_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_processed', true),
        supabase.from('agent_knowledge_gaps').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open'),
        fetch('/api/agent/rules', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).catch(() => null),
      ]);
      const pagePromise = supabase.from('pages').select('id, theme').eq('user_id', user.id).maybeSingle();
      const subscriptionPromise = supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
      const conversationsPromise = supabase
        .from('agent_conversations')
        .select('id, message_count, created_at, visitor_name')
        .eq('agent_owner_id', user.id)
        .order('created_at', { ascending: false });

      const userProfile = await userProfilePromise;
      setProfile(userProfile);

      // Load agent config - rescue if missing
      let { data: config } = await configPromise;
      
      if (!config) {
        console.log('[v0] Auto-repairing missing agent config for user:', user.id);
        const { data: newConfig } = await supabase.from('agent_configs').insert({
          user_id: user.id,
          agent_name: 'Your AI',
          welcome_message: "Hi! I'm the AI assistant for this page. How can I help you?",
          is_enabled: true,
          primary_color: '#f46530'
        }).select().single();
        config = newConfig;
      }
      
      setAgentConfig(config);

      const [factsResult, documentsResult, gapsResult, rulesResult] = await readinessPromise;
      setReadinessData({
        knowledgeCount: (factsResult.count || 0) + (documentsResult.count || 0),
        openGaps: gapsResult.count || 0,
        rules: rulesResult?.rules || null,
      });

      // Load public page - ensure it exists (Fixes "Setting up the clone" error)
      const { data: pageData, error: pageFetchError } = await pagePromise;
      
      // If missing or broken, force-create a default
      if (!pageData || pageFetchError) {
        console.log('[v0] Auto-repairing missing public page for user:', user.id);
        await supabase.from('pages').upsert({
          user_id: user.id,
          name: userProfile?.full_name || userProfile?.username || 'User',
          tagline: 'Welcome to my Qlynk page!',
          profession: 'Creative Professional',
          theme: 'quickpitch',
          theme_category: 'freelancers',
          theme_data: { 
            config_version: 'v1',
            headline: userProfile?.full_name || userProfile?.username || 'User',
            subhead: 'Ask me about the information I have been set up to share.',
            email: user.email || ''
          },
          is_published: true
        }, { onConflict: 'user_id' });
      }

      // Load subscription for usage limits
      const { data: subData } = await subscriptionPromise;
      
      setSubscription(subData);

      // Load conversation stats
      const { data: conversations } = await conversationsPromise;

      if (conversations) {
        const totalConvos = conversations.length;
        const totalMsgs = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentConvos = conversations.filter(c => new Date(c.created_at) > weekAgo);
        const msgsThisWeek = recentConvos.reduce((sum, c) => sum + (c.message_count || 0), 0);

        setStats({
          totalConversations: totalConvos,
          totalMessages: totalMsgs,
          messagesThisWeek: msgsThisWeek,
          avgMessagesPerConvo: totalConvos > 0 ? Math.round(totalMsgs / totalConvos) : 0,
          messagesUsed: getCurrentMessagesUsed(subData),
          messagesLimit: getMessageLimit(getEffectiveTier(subData)),
          tier: getEffectiveTier(subData)
        });

        setRecentConversations(conversations.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      await loadDashboardData();
      
      // Check Stripe checkout redirect session
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        announceDashboardTourCheckoutState(true);
        setVerifyingPayment(true);
        let welcomeWillOpen = false;
        try {
          const res = await fetch('/api/checkout/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
          });
          const data = await res.json();
          if (data.success) {
            // Trigger confetti welcome animation
            const { default: confetti } = await import('canvas-confetti');
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#f46530', '#3b82f6', '#10b981', '#a855f7']
            });
            
            setNewPlanName(data.tier);
            setShowWelcomeModal(true);
            welcomeWillOpen = true;
            
            // Clean URL query params
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Reload updated billing data
            await loadDashboardData();
          }
        } catch (err) {
          console.error('Error confirming checkout session:', err);
        } finally {
          setVerifyingPayment(false);
          if (!welcomeWillOpen) {
            announceDashboardTourCheckoutState(false);
          }
        }
      }
    };

    initDashboard();
  }, []);

  const toggleAgentStatus = async () => {
    if (!agentConfig || !profile) return;
    
    const supabase = createClient();
    const newStatus = !agentConfig.is_enabled;
    
    const { error } = await supabase
      .from('agent_configs')
      .update({ is_enabled: newStatus })
      .eq('user_id', profile.id);
    
    if (!error) {
      setAgentConfig(prev => ({ ...prev, is_enabled: newStatus }));
    }
  };

  const closeSubscriptionWelcome = () => {
    setShowWelcomeModal(false);
    announceDashboardTourCheckoutState(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const readinessItems = [
    { label: 'Agent identity', complete: Boolean(agentConfig?.agent_name && agentConfig.agent_name !== 'Your AI'), href: '/dashboard/agent?section=general' },
    { label: 'Purpose and audience', complete: Boolean(readinessData.rules?.purpose && readinessData.rules?.audience), href: '/dashboard/agent?section=general' },
    { label: 'Approved knowledge', complete: readinessData.knowledgeCount > 0, href: '/dashboard/knowledge' },
    { label: 'Uncertainty and handoff', complete: Boolean(readinessData.rules?.uncertainty_message && readinessData.rules?.escalation_message), href: '/dashboard/agent?section=general' },
    { label: 'Welcome experience', complete: Boolean(agentConfig?.welcome_message && agentConfig.welcome_message.length >= 12), href: '/dashboard/agent?section=general' },
    { label: 'Agent published', complete: Boolean(agentConfig?.is_enabled), href: '/dashboard/agent?section=general' },
  ];
  const readinessComplete = readinessItems.filter((item) => item.complete).length;
  const readinessScore = Math.round((readinessComplete / readinessItems.length) * 100);
  const isFullyReady = readinessComplete === readinessItems.length;
  const nextReadinessItem = readinessItems.find((item) => !item.complete);

  return (
    <PageFrame>
      {verifyingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-[#f46530]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#f46530]/20 animate-pulse">
            <Sparkles className="text-[#f46530] animate-spin" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Verifying Payment...</h2>
          <p className="text-gray-400 max-w-sm">We are confirming your subscription with Stripe. Your dashboard will update in a moment.</p>
        </div>
      )}

      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#f46530]/10 rounded-full blur-[80px] -mt-32" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <Sparkles className="text-green-400" size={32} />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-3">Welcome to Qlynk!</h2>
              <p className="text-gray-300 font-bold mb-4 capitalize">You are now subscribed to the {newPlanName} Plan!</p>
              
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Thank you for subscribing. Your message limits have been increased and your advanced configurations are now active. Enjoy your personalized AI representative!
              </p>
              
              <button
                onClick={closeSubscriptionWelcome}
                className="w-full py-4 bg-[#f46530] text-white rounded-2xl font-bold hover:bg-[#f46530]/95 active:scale-95 transition-all shadow-lg shadow-[#f46530]/20"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        icon={LayoutDashboard}
        title="Overview"
        description={`Welcome back, ${profile?.username || 'there'}. Here's how your agent is doing.`}
        actions={(
          <>
            <Link href={`/${profile?.username}`} target="_blank" className={`flex-1 sm:flex-none ${DASHBOARD_BUTTON_SECONDARY}`}>
              <ExternalLink size={16} />
              Live page
            </Link>
            <Link href="/dashboard/agent?section=general" className={`flex-1 sm:flex-none ${DASHBOARD_BUTTON_PRIMARY}`}>
              <Settings size={16} />
              Configure
            </Link>
          </>
        )}
      />

      <UpgradePrompt />
      <TrialChoiceManager subscription={subscription} userId={profile?.id} />

      {isAccountDeletionScheduled && (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300 mb-1">Account pending deletion</p>
            <h2 className="text-xl font-black text-white">Your account will be deleted soon</h2>
            <p className="text-sm text-amber-100/80 mt-1">
              You can still use the app until {new Date(profile.account_deletion_scheduled_for).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}. The final removal runs automatically and may finish later that day. You can cancel it from Settings if you changed your mind.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-100"
          >
            Manage deletion
          </Link>
        </div>
      )}

      {isPaymentPastDue && (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300 mb-1">Payment issue</p>
            <h2 className="text-xl font-black text-white">Your Agency payment is past due</h2>
            <p className="text-sm text-amber-100/80 mt-1">
              Update billing to restore Agency benefits. Your agent can continue within the free Creator allowance.
            </p>
          </div>
          <div className="flex shrink-0 flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-100"
            >
              Fix billing
            </Link>
            <Link href="/pricing" className={DASHBOARD_BUTTON_SECONDARY}>
              View plans
            </Link>
          </div>
        </div>
      )}

      {/* Setup checklist leads the page until the agent is fully ready */}
      {!isFullyReady && (
        <section className={`${DASHBOARD_CARD} relative mb-6 overflow-hidden p-6 sm:p-7`} aria-labelledby="setup-heading">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#f46530]/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-10">
            <div className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a5f]">Finish setting up</p>
              <h2 id="setup-heading" className="mt-1.5 text-2xl font-black tracking-tight text-white">{readinessScore}% ready</h2>
              <p className="mt-1 text-sm text-gray-400">{readinessComplete} of {readinessItems.length} steps done. Complete the rest so visitors get great answers.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#f46530] to-amber-400 transition-all" style={{ width: `${readinessScore}%` }} />
              </div>
              {nextReadinessItem && (
                <Link href={nextReadinessItem.href} className={`mt-5 self-start ${DASHBOARD_BUTTON_PRIMARY}`}>
                  Next: {nextReadinessItem.label}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <ReadinessList items={readinessItems} className="sm:grid-cols-2" />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main column */}
        <div className="min-w-0 space-y-6 xl:col-span-2">
          {/* Agent status */}
          <section className={`${DASHBOARD_CARD} flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex min-w-0 items-center gap-4">
              <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                agentConfig?.is_enabled ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'
              }`}>
                <Bot className={agentConfig?.is_enabled ? 'text-green-400' : 'text-gray-500'} size={28} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-bold tracking-tight text-white">
                    {agentConfig?.agent_name || 'Your AI'}
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    agentConfig?.is_enabled ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-gray-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${agentConfig?.is_enabled ? 'animate-pulse bg-green-500' : 'bg-gray-500'}`} />
                    {agentConfig?.is_enabled ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-400">
                  {agentConfig?.is_enabled
                    ? 'Your agent is live and answering visitors.'
                    : 'Your agent is turned off. Visitors can’t chat with it.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(agentConfig?.is_enabled)}
              aria-label={agentConfig?.is_enabled ? 'Turn agent off' : 'Turn agent on'}
              onClick={toggleAgentStatus}
              className={`relative h-8 w-14 shrink-0 self-end rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f46530] sm:self-auto ${
                agentConfig?.is_enabled
                  ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                agentConfig?.is_enabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </section>

          {/* Core stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Conversations', value: stats.totalConversations, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-[#f46530]', bg: 'bg-[#f46530]/10' },
              { label: 'Last 7 days', value: stats.messagesThisWeek, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Avg. length', value: stats.avgMessagesPerConvo, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' }
            ].map((stat) => (
              <div key={stat.label} className={`${DASHBOARD_CARD} flex h-full flex-col p-5`}>
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={stat.color} size={19} />
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-black tracking-tight text-white tabular-nums">{stat.value}</div>
                  <div className="mt-0.5 text-xs font-semibold text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <section className={`${DASHBOARD_CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <h3 className="text-base font-bold text-white">Recent activity</h3>
              <Link href="/dashboard/conversations" className="flex items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-white">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {recentConversations.length > 0 ? (
              <ul className="divide-y divide-white/[0.05]">
                {recentConversations.map((convo) => (
                  <li key={convo.id}>
                    <Link
                      href={{ pathname: '/dashboard/conversations', query: { conversation: convo.id } }}
                      aria-label={`Open conversation with ${convo.visitor_name || 'Anonymous Visitor'}`}
                      className="group flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition-colors group-hover:text-white">
                          <Users size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {convo.visitor_name || 'Anonymous Visitor'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2.5 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1"><MessageSquare size={12} /> {convo.message_count || 0} msgs</span>
                            <span className="h-1 w-1 rounded-full bg-gray-600" />
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(convo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
                  <MessageSquare size={22} />
                </div>
                <h4 className="mb-1 font-bold text-white">No conversations yet</h4>
                <p className="mx-auto max-w-xs text-sm text-gray-400">Share your agent link to start answering questions for visitors.</p>
              </div>
            )}
          </section>
        </div>

        {/* Side column */}
        <div className="min-w-0 space-y-6">
          {/* Plan & usage */}
          <section className={`${DASHBOARD_CARD} relative overflow-hidden p-6`}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#f46530]/15 blur-3xl" aria-hidden="true" />

            <div className="relative mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Current plan</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black capitalize text-white">{stats.tier}</h3>
                  {stats.tier === 'creator' && <span className="text-sm font-bold text-emerald-400">Free forever</span>}
                </div>
              </div>
              <Link href="/dashboard/billing" aria-label="Open billing" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                <CreditCard size={18} />
              </Link>
            </div>

            <div className="relative mb-6">
              <div className="mb-2 flex items-end justify-between">
                <p className="text-sm font-medium text-gray-400">Message quota</p>
                <p className="text-sm font-bold text-white tabular-nums">
                  {stats.messagesUsed} <span className="text-gray-500">/ {stats.messagesLimit}</span>
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f46530] to-[#f68356]"
                  style={{ width: `${stats.messagesLimit ? Math.min(100, (stats.messagesUsed / stats.messagesLimit) * 100) : 0}%` }}
                />
              </div>
            </div>

            <Link href="/pricing" className={`relative w-full ${DASHBOARD_BUTTON_SECONDARY}`}>
              <Sparkles size={16} className="text-[#f46530]" />
              Upgrade plan
            </Link>
          </section>

          {/* Readiness (compact once everything is done) */}
          {isFullyReady && (
            <section className={`${DASHBOARD_CARD} flex items-center gap-4 p-5`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
                <Check size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white">Agent is fully set up</h3>
                <p className="text-sm text-gray-400">All {readinessItems.length} setup steps are done.</p>
              </div>
              <Link href="/dashboard/agent?section=general" className="shrink-0 text-sm font-semibold text-gray-400 transition-colors hover:text-white">
                Edit
              </Link>
            </section>
          )}

          {readinessData.openGaps > 0 && (
            <Link href="/dashboard/knowledge" className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-5 py-4 text-sm text-amber-200 transition-colors hover:bg-amber-500/[0.12]">
              <span className="flex items-center gap-2.5">
                <Lightbulb size={16} className="shrink-0" />
                {readinessData.openGaps} knowledge gap{readinessData.openGaps === 1 ? '' : 's'} need{readinessData.openGaps === 1 ? 's' : ''} attention
              </span>
              <span className="flex shrink-0 items-center gap-1 font-semibold">Review <ArrowRight size={14} /></span>
            </Link>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function ReadinessList({ items, className = '' }) {
  return (
    <ul className={`grid gap-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.04]"
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              item.complete ? 'bg-green-500/15 text-green-300' : 'border border-white/15 text-transparent'
            }`}>
              <Check size={12} strokeWidth={3} />
            </span>
            <span className={`flex-1 text-sm ${item.complete ? 'text-gray-500 line-through decoration-gray-600' : 'font-semibold text-white'}`}>{item.label}</span>
            {!item.complete && <ArrowRight size={14} className="shrink-0 text-gray-600 transition-colors group-hover:text-white" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
