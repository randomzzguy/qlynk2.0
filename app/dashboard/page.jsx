'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Settings,
  ExternalLink,
  Clock,
  Zap,
  FileText,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { 
  getTrialDaysRemaining, 
  isTrialExpired,
  PLAN_LIMITS 
} from '@/lib/subscriptionHelpers';
import UpgradePrompt from '@/components/UpgradePrompt';
import TrialChoiceManager from '@/components/TrialChoiceManager';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [agentConfig, setAgentConfig] = useState(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    messagesThisWeek: 0,
    avgMessagesPerConvo: 0,
    messagesUsed: 0,
    messagesLimit: 0,
    tier: 'Trial'
  });
  const [recentConversations, setRecentConversations] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const userProfile = await getCurrentProfile();
        setProfile(userProfile);

        const supabase = createClient();

        // Load agent config - rescue if missing
        let { data: config } = await supabase
          .from('agent_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!config) {
          console.log('[v0] Auto-repairing missing agent config for user:', user.id);
          const { data: newConfig } = await supabase.from('agent_configs').insert({
            user_id: user.id,
            agent_name: 'q-agent',
            welcome_message: "Hi! I'm the AI assistant for this page. How can I help you?",
            is_enabled: true,
            primary_color: '#f46530'
          }).select().single();
          config = newConfig;
        }
        
        setAgentConfig(config);

        // Load public page - ensure it exists (Fixes "Setting up the clone" error)
        const { data: pageData, error: pageFetchError } = await supabase
          .from('pages')
          .select('id, theme')
          .eq('user_id', user.id)
          .maybeSingle();
        
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
              subhead: 'Welcome to my digital twin.',
              email: user.email || ''
            },
            is_published: true
          }, { onConflict: 'user_id' });
        }

        // Load subscription for usage limits
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setSubscription(subData);

        // Load conversation stats
        const { data: conversations } = await supabase
          .from('agent_conversations')
          .select('id, message_count, created_at, visitor_name')
          .eq('agent_owner_id', user.id)
          .order('created_at', { ascending: false });

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
            messagesUsed: subData?.messages_used || 0,
            messagesLimit: PLAN_LIMITS[subData?.tier?.toLowerCase()] || 1000,
            tier: subData?.tier || 'Trial'
          });

          setRecentConversations(conversations.slice(0, 5));
        }
        // Check for trial expiration and handle choice
        if (subData?.tier === 'trial' && isTrialExpired(subData.trial_ends_at)) {
          const choice = subData.post_trial_choice || 'pause';
          
          if (choice === 'pause') {
            // Update status to paused if not already
            if (subData.status !== 'paused') {
              await supabase
                .from('subscriptions')
                .update({ 
                  status: 'paused',
                  pause_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('user_id', user.id);
            }
          } else {
            // Redirect to checkout for the chosen plan
            // router.push(`/pricing?plan=${choice}`); 
            // Better to show a modal or a clear message, but for now let's just mark it as "needs payment"
          }
        }

      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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

  const handlePortal = async () => {
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback to pricing if no portal (e.g. trial with no stripe customer yet)
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <UpgradePrompt />
      <TrialChoiceManager subscription={subscription} userId={profile?.id} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">
            Overview
          </h1>
          <p className="text-gray-400 font-medium">Welcome back, {profile?.username || 'there'}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link 
            href={`/${profile?.username}`}
            target="_blank"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold"
          >
            <ExternalLink size={16} />
            <span>Live Page</span>
          </Link>
          <Link 
            href="/dashboard/agent"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#f46530] to-[#f68356] text-white rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(244,101,48,0.4)] transition-all text-sm"
          >
            <Settings size={16} />
            Configure
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Agent Status Banner */}
          <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                agentConfig?.is_enabled 
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                {agentConfig?.is_enabled && (
                  <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                )}
                <Bot className={agentConfig?.is_enabled ? 'text-green-400 relative z-10' : 'text-gray-500'} size={32} />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {agentConfig?.agent_name || 'q-agent'}
                  </h2>
                  {agentConfig?.is_enabled && (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Online
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  {agentConfig?.is_enabled 
                    ? 'Your AI clone is active and receiving visitors.' 
                    : 'Your AI clone is currently disabled.'}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleAgentStatus}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 shrink-0 ${
                agentConfig?.is_enabled 
                  ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                agentConfig?.is_enabled ? 'translate-x-9' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Core Stats Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Convos', value: stats.totalConversations, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-[#f46530]', bg: 'bg-[#f46530]/10' },
              { label: '7-Day Activity', value: stats.messagesThisWeek, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Avg Length', value: stats.avgMessagesPerConvo, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 p-5 flex flex-col justify-between hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                  <stat.icon className={stat.color} size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[400px]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <Link href="/dashboard/conversations" className="text-sm text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors">
                View all <ExternalLink size={14} />
              </Link>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              {recentConversations.length > 0 ? (
                <div className="space-y-4">
                  {recentConversations.map((convo) => (
                    <div key={convo.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-0.5">
                            {convo.visitor_name || 'Anonymous Visitor'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1"><MessageSquare size={12}/> {convo.message_count || 0} msgs</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(convo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-500 group-hover:text-white transition-colors">
                        <ExternalLink size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 text-gray-500">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="text-white font-bold mb-1">No conversations yet</h4>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">Share your profile link to start engaging with your audience.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Secondary Content Area */}
        <div className="space-y-6">
          
          {/* Usage & Plan */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f46530]/20 blur-3xl rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Current Plan</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-white capitalize">{stats.tier}</h3>
                  {stats.tier === 'trial' && !isTrialExpired(profile?.trial_ends_at) && (
                    <span className="text-[#f46530] text-sm font-bold bg-[#f46530]/10 px-2 py-0.5 rounded-lg">
                      {getTrialDaysRemaining(profile?.trial_ends_at)}d left
                    </span>
                  )}
                </div>
              </div>
              <Link href="/dashboard/billing" className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <CreditCard size={18} />
              </Link>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-gray-400 font-medium">Message Quota</p>
                <p className="text-sm font-bold text-white">
                  {stats.messagesUsed} <span className="text-gray-500">/ {stats.messagesLimit}</span>
                </p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#f46530] to-[#f68356] rounded-full"
                  style={{ width: `${Math.min(100, (stats.messagesUsed / stats.messagesLimit) * 100)}%` }}
                />
              </div>
            </div>

            <Link 
              href="/pricing"
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles size={16} className="text-[#f46530]" />
              Upgrade Plan
            </Link>
          </div>

          {/* Quick Actions List */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/dashboard/knowledge" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Knowledge Base</div>
                  <div className="text-gray-400 text-xs font-medium">Manage AI training data</div>
                </div>
              </Link>
              <Link href="/dashboard/analytics" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Analytics</div>
                  <div className="text-gray-400 text-xs font-medium">View engagement metrics</div>
                </div>
              </Link>
              <Link href="/dashboard/agent" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-[#f46530]/10 text-[#f46530] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Agent Settings</div>
                  <div className="text-gray-400 text-xs font-medium">Tweak persona & rules</div>
                </div>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
