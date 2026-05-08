'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  BarChart3, 
  Users, 
  MessageCircle, 
  Zap, 
  Lock, 
  ChevronRight, 
  Search,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NeuralInsights() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('free'); // 'free' or 'pro'
  const [selectedChat, setSelectedChat] = useState(null);
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    activeVisitors: 0
  });

  const supabase = createClient();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Subscription Tier (Mocked for now, will connect to Stripe later)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();
      
      const currentTier = sub?.tier?.toLowerCase() || 'free';
      setTier(currentTier);

      // 2. Fetch Conversations
      const { data: convs, error: convError } = await supabase
        .from('agent_conversations')
        .select(`
          *,
          agent_messages(count)
        `)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      setConversations(convs || []);

      // 3. Calculate Stats
      const totalChats = convs?.length || 0;
      const totalMessages = convs?.reduce((acc, curr) => acc + (curr.agent_messages[0]?.count || 0), 0) || 0;
      const activeVisitors = new Set(convs?.map(c => c.visitor_id)).size || 0;

      setStats({ totalChats, totalMessages, activeVisitors });
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setSelectedChat({
        ...conversations.find(c => c.id === convId),
        messages: data
      });
    }
  };

  const EliteFeature = ({ title, icon: Icon, description }) => (
    <div className="relative group overflow-hidden bg-white/[0.02] border border-white/10 p-6 rounded-3xl transition-all hover:bg-white/[0.04]">
      {tier === 'free' && (
        <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-black/40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
            <Lock className="text-white w-5 h-5" />
          </div>
          <h4 className="text-white font-bold text-sm tracking-tight">Elite Insight Locked</h4>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[150px]">Upgrade to Pro to unlock AI-powered neural analysis.</p>
          <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30 px-4 py-2 rounded-full hover:bg-amber-400 hover:text-black transition-all">
            Upgrade Now
          </button>
        </div>
      )}
      
      <div className={`relative z-10 ${tier === 'free' ? 'opacity-20 grayscale' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Icon className="text-blue-400 w-5 h-5" />
          </div>
          <h3 className="font-bold text-white tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        
        {tier === 'pro' && (
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Analysis
            </span>
            <ArrowUpRight className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 font-sans">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Neural Insights
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-tighter border border-blue-500/30">
                Live Data
              </span>
            </h1>
            <p className="text-gray-400 font-medium">Analyze how your digital twin is representing you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Chats', value: stats.totalChats, icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Neural Messages', value: stats.totalMessages, icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Unique Visitors', value: stats.activeVisitors, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-[40px] -mr-12 -mt-12 transition-all group-hover:scale-150`} />
                <div className="relative z-10 space-y-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                    <stat.icon className={`${stat.color} w-5 h-5`} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <h2 className="text-3xl font-black text-white">{stat.value}</h2>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Elite Promo Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20 flex flex-col justify-between group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <Zap className="w-12 h-12 mb-6 text-amber-300 fill-amber-300 animate-pulse" />
            <h2 className="text-2xl font-black mb-2 tracking-tight leading-tight">Switch to Elite Insights</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 opacity-80 font-medium">
              Unlock sentiment analysis, topic clustering, and automated lead scoring. Make your AI work for your growth.
            </p>
          </div>
          <button className="relative z-10 w-full bg-white text-blue-600 font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
            Upgrade for $19/mo
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Content: Logs & Elite Features */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Left: Chat Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Recent Conversations
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <p className="text-gray-500">No conversations recorded yet.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button 
                  key={conv.id}
                  onClick={() => fetchMessages(conv.id)}
                  className={`w-full text-left bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-blue-500/50 transition-all group flex items-center justify-between ${selectedChat?.id === conv.id ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all">
                      <Users className="text-gray-400 group-hover:text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{conv.visitor_id.substring(0, 12)}...</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(conv.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{conv.agent_messages[0]?.count || 0}</p>
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Messages</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-400 transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Elite Features & Transcript */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div 
                key="transcript"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 max-h-[700px] flex flex-col relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Neural Transcript
                  </h3>
                  <button onClick={() => setSelectedChat(null)} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Close</button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {selectedChat.messages?.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-bold text-gray-600 mb-2 uppercase tracking-widest px-2">
                        {msg.role === 'user' ? 'Visitor' : 'Your AI'}
                      </span>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[90%] ${
                        msg.role === 'user' 
                          ? 'bg-white/10 text-white border border-white/10' 
                          : 'bg-blue-500/10 text-blue-100 border border-blue-500/20'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="features"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-6"
              >
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-2">
                  Elite Capabilities
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h3>
                
                <EliteFeature 
                  title="Sentiment Analysis"
                  icon={TrendingUp}
                  description="Detect the emotional tone of your visitors. Know if they are frustrated, excited, or curious."
                />
                
                <EliteFeature 
                  title="Topic Clustering"
                  icon={BrainCircuit}
                  description="Automatically group common questions into themes. See exactly what your audience cares about."
                />

                <EliteFeature 
                  title="Lead Scoring"
                  icon={Zap}
                  description="AI automatically identifies high-value visitors who are most likely to book or buy."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
