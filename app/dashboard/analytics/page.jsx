'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer2,
  MessageCircle,
  Bot,
  Clock,
  User,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [agentStats, setAgentStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConvo: 0,
    todayConversations: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      const supabase = createClient();

      // Load conversations
      const { data: convos } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('agent_owner_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (convos) {
        setConversations(convos);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayConvos = convos.filter(c => new Date(c.started_at) >= today);
        const totalMessages = convos.reduce((sum, c) => sum + (c.message_count || 0), 0);
        
        setAgentStats({
          totalConversations: convos.length,
          totalMessages,
          avgMessagesPerConvo: convos.length > 0 ? (totalMessages / convos.length).toFixed(1) : 0,
          todayConversations: todayConvos.length
        });
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const loadConversationMessages = async (conversationId) => {
    setLoadingMessages(true);
    setSelectedConversation(conversationId);
    
    const supabase = createClient();
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messages) {
      setConversationMessages(messages);
    }
    setLoadingMessages(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const pageStats = [
    { label: 'Total Views', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Unique Visitors', value: '856', change: '+8%', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Clicks', value: '342', change: '+24%', icon: MousePointer2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Engagement Rate', value: '28%', change: '+2%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

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

      <h1 className="text-3xl font-black text-white mb-10 flex items-center gap-3">
        Analytics
        <Sparkles size={20} className="text-[#f46530]" />
      </h1>

          {/* Page Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {pageStats.map((stat, index) => (
              <div key={index} className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-[#f46530]/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${stat.bg}`}>
                    <stat.icon className={stat.color} size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Q-Agent Stats */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bot className="text-[#f46530]" size={20} />
              Q-Agent Performance
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-[#f46530]/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#f46530]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="text-[#f46530]" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{agentStats.totalConversations}</h3>
                <p className="text-sm text-gray-400">Total Conversations</p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="text-cyan-400" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{agentStats.totalMessages}</h3>
                <p className="text-sm text-gray-400">Total Messages</p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-green-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="text-green-400" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{agentStats.avgMessagesPerConvo}</h3>
                <p className="text-sm text-gray-400">Avg per Conversation</p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="text-purple-400" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{agentStats.todayConversations}</h3>
                <p className="text-sm text-gray-400">Today&apos;s Convos</p>
              </div>
            </div>
          </div>

          {/* Conversations and Transcript View */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Conversations List */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 flex flex-col h-[600px]">
              <h3 className="text-lg font-bold text-white mb-6">Recent Conversations</h3>
              
              {conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <MessageCircle className="text-gray-600" size={28} />
                  </div>
                  <p className="text-gray-400">No conversations yet</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-[240px]">
                    Visitors chatting with your agent will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => loadConversationMessages(convo.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                        selectedConversation === convo.id
                          ? 'bg-[#f46530]/10 border border-[#f46530]/30 shadow-[0_0_15px_rgba(244,101,48,0.1)]'
                          : 'bg-gray-900/50 border border-gray-700/50 hover:border-[#f46530]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          selectedConversation === convo.id ? 'bg-[#f46530]/20' : 'bg-gray-800 group-hover:bg-gray-700'
                        }`}>
                          <User size={18} className={selectedConversation === convo.id ? 'text-[#f46530]' : 'text-gray-400'} />
                        </div>
                        <div>
                          <p className={`font-medium ${selectedConversation === convo.id ? 'text-[#f46530]' : 'text-white'}`}>
                            Visitor {convo.visitor_id?.slice(0, 8) || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <MessageCircle size={12} />
                              {convo.message_count || 0}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(convo.started_at)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className={`transition-transform ${selectedConversation === convo.id ? 'text-[#f46530] translate-x-1' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Transcript */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 flex flex-col h-[600px]">
              <h3 className="text-lg font-bold text-white mb-6">Conversation Transcript</h3>
              
              {!selectedConversation ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <MessageCircle className="text-gray-600" size={28} />
                  </div>
                  <p className="text-gray-400">Select a conversation to view transcript</p>
                </div>
              ) : loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#f46530] animate-spin" />
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400">No messages in this conversation</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {conversationMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        msg.role === 'user' ? 'bg-gray-800 border-gray-700' : 'bg-[#f46530]/10 border-[#f46530]/20'
                      }`}>
                        {msg.role === 'user' ? (
                          <User size={14} className="text-gray-400" />
                        ) : (
                          <Bot size={14} className="text-[#f46530]" />
                        )}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-gray-800 border border-gray-700 text-white rounded-tr-none' 
                          : 'bg-gray-900/80 border border-gray-700/50 text-gray-200 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Traffic Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mt-10 mb-20">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 hover:border-cyan-500/20 transition-all">
              <h3 className="text-lg font-bold text-white mb-8">Traffic Overview</h3>
              <div className="h-64 flex items-end justify-between gap-3 px-2">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-cyan-500/5 rounded-t-xl relative group h-full">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600/80 to-cyan-400/80 rounded-t-xl transition-all group-hover:from-cyan-500 group-hover:to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                      style={{ height: `${h}%` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.round(h * 12.5)} visits
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 hover:border-purple-500/20 transition-all">
              <h3 className="text-lg font-bold text-white mb-8">Top Locations</h3>
              <div className="space-y-6">
                {[
                  { country: 'United States', percentage: 45, color: 'bg-purple-500' },
                  { country: 'United Kingdom', percentage: 20, color: 'bg-cyan-500' },
                  { country: 'Canada', percentage: 15, color: 'bg-green-500' },
                  { country: 'Germany', percentage: 10, color: 'bg-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-sm text-white flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        {item.country}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${item.color} shadow-[0_0_10px_rgba(168,85,247,0.2)]`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
