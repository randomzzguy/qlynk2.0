'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    tier: 'Trial'
  });
  const [recentConversations, setRecentConversations] = useState([]);
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
            agent_name: 'Q-Agent',
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
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Load conversation stats
        const { data: conversations } = await supabase
          .from('agent_conversations')
          .select('id, message_count, started_at')
          .eq('agent_owner_id', user.id)
          .order('started_at', { ascending: false });

        if (conversations) {
          const totalConvos = conversations.length;
          const totalMsgs = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
          
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const recentConvos = conversations.filter(c => new Date(c.started_at) > weekAgo);
          const msgsThisWeek = recentConvos.reduce((sum, c) => sum + (c.message_count || 0), 0);

          setStats({
            totalConversations: totalConvos,
            totalMessages: totalMsgs,
            messagesThisWeek: msgsThisWeek,
            avgMessagesPerConvo: totalConvos > 0 ? Math.round(totalMsgs / totalConvos) : 0,
            messagesUsed: subscription?.messages_used || 0,
            messagesLimit: PLAN_LIMITS[subscription?.tier?.toLowerCase()] || 1000,
            tier: subscription?.tier || 'Trial'
          });

          setRecentConversations(conversations.slice(0, 5));
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
    <div className="max-w-6xl mx-auto px-6 py-10">
      <UpgradePrompt />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome back, {profile?.username || 'there'}
          </h1>
          <p className="text-lg text-gray-400">Here&apos;s how your Q-Agent is performing</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={`/${profile?.username}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-[#f46530]/50 hover:bg-gray-800 transition-all"
          >
            <ExternalLink size={18} />
            View Live Page
          </Link>
          <button 
            onClick={handlePortal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-purple-500/50 hover:bg-gray-800 transition-all"
          >
            <CreditCard size={18} />
            Manage Billing
          </button>
          <Link 
            href="/dashboard/agent"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#f46530] text-white rounded-xl font-semibold hover:bg-[#f46530]/90 shadow-lg shadow-[#f46530]/20 transition-all"
          >
            <Settings size={18} />
            Configure Agent
          </Link>
        </div>
      </div>

      {/* Agent Status Card */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              agentConfig?.is_enabled 
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                : 'bg-gray-700/50 border border-gray-600/50'
            }`}>
              <Bot className={agentConfig?.is_enabled ? 'text-green-400' : 'text-gray-500'} size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {agentConfig?.agent_name || 'Q-Agent'}
                {agentConfig?.is_enabled && <Sparkles size={16} className="text-[#f46530]" />}
              </h2>
              <p className="text-gray-400">
                {agentConfig?.is_enabled 
                  ? 'Your agent is live and ready to chat with visitors' 
                  : 'Your agent is currently offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              agentConfig?.is_enabled 
                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
            }`}>
              {agentConfig?.is_enabled ? (
                <>
                  <Eye size={16} />
                  Live
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  Offline
                </>
              )}
            </div>
            
            <button
              onClick={toggleAgentStatus}
              className={`relative w-14 h-7 rounded-full transition-all ${
                agentConfig?.is_enabled 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30' 
                  : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                agentConfig?.is_enabled ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    
      {/* Usage & Plan Card */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-bold">Current Plan</p>
            <h3 className="text-3xl font-black text-white capitalize mb-1">{stats.tier}</h3>
            {stats.tier === 'trial' && !isTrialExpired(profile?.trial_ends_at) && (
              <p className="text-[#f46530] text-sm font-bold">
                {getTrialDaysRemaining(profile?.trial_ends_at)} days left
              </p>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm text-gray-400 font-bold">Message Usage</p>
              <p className="text-sm font-bold text-white">
                {stats.messagesUsed} / {stats.messagesLimit}
              </p>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#f46530] to-purple-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.messagesUsed / stats.messagesLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 flex flex-col justify-center text-center">
          <p className="text-white font-bold mb-3">Need more power?</p>
          <Link 
            href="/pricing"
            className="bg-white text-purple-600 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-[#f46530]/30 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#f46530]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="text-[#f46530]" size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.totalMessages}</div>
          <div className="text-sm text-gray-400">Total Messages</div>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="text-cyan-400" size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.totalConversations}</div>
          <div className="text-sm text-gray-400">Conversations</div>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-green-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="text-green-400" size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.messagesThisWeek}</div>
          <div className="text-sm text-gray-400">Messages This Week</div>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="text-purple-400" size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.avgMessagesPerConvo}</div>
          <div className="text-sm text-gray-400">Avg per Conversation</div>
        </div>
      </div>

      {/* Recent Conversations & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Conversations</h3>
            <Link 
              href="/dashboard/conversations"
              className="text-sm text-[#f46530] hover:text-[#f46530]/80 font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((convo) => (
                <div 
                  key={convo.id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-[#f46530]/20 transition-colors">
                      <Users size={18} className="text-gray-400 group-hover:text-[#f46530]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Visitor</p>
                      <p className="text-sm text-gray-400">
                        {convo.message_count || 0} messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    {new Date(convo.started_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                <MessageSquare className="text-gray-500" size={28} />
              </div>
              <p className="text-gray-400 mb-2">No conversations yet</p>
              <p className="text-sm text-gray-500">
                Share your page link to start getting visitors
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link
              href="/dashboard/agent"
              className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/50 hover:bg-gray-900/80 transition-all group"
            >
              <div className="w-10 h-10 bg-[#f46530]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="text-[#f46530]" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Edit Agent</p>
                <p className="text-xs text-gray-400">Customize responses</p>
              </div>
            </Link>

            <Link
              href="/dashboard/agent/documents"
              className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-900/80 transition-all group"
            >
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="text-cyan-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Knowledge Base</p>
                <p className="text-xs text-gray-400">Upload documents</p>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-green-500/50 hover:bg-gray-900/80 transition-all group"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">View Analytics</p>
                <p className="text-xs text-gray-400">Track performance</p>
              </div>
            </Link>

            <a
              href={`/${profile?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-900/80 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ExternalLink className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Preview Page</p>
                <p className="text-xs text-gray-400">See live agent</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
