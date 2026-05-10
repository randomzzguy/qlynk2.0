'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle,
  Bot,
  Clock,
  User,
  Loader2,
  Sparkles,
  ChevronRight,
  Calendar,
  Zap,
  Activity,
  Eye,
  MousePointer2
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayLabel(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function countInRange(rows, dateField, start, end) {
  return rows.filter(r => {
    const d = new Date(r[dateField]);
    return d >= start && d <= end;
  }).length;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) { router.push('/auth/login'); return; }

      const supabase = createClient();

      // Fetch conversations + page views in parallel
      const [convoRes, viewRes] = await Promise.all([
        supabase
          .from('agent_conversations')
          .select('id, visitor_id, visitor_name, visitor_email, message_count, created_at')
          .eq('agent_owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('page_views')
          .select('id, visitor_id, referrer, created_at')
          .eq('page_owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2000),
      ]);

      const convos = convoRes.data || [];
      const views  = viewRes.data  || [];

      setConversations(convos.slice(0, 50));

      const now = new Date();

      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

      const weekStart  = new Date(now); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);

      // ── View stats ────────────────────────────────────────────────────
      const totalViews      = views.length;
      const uniqueViewers   = new Set(views.map(v => v.visitor_id).filter(Boolean)).size;
      const todayViews      = countInRange(views, 'created_at', todayStart, todayEnd);
      const weekViews       = countInRange(views, 'created_at', weekStart, now);

      // ── Conversation stats ────────────────────────────────────────────
      const totalConvos     = convos.length;
      const totalMessages   = convos.reduce((s, c) => s + (c.message_count || 0), 0);
      const weekConvos      = convos.filter(c => new Date(c.created_at) >= weekStart);
      const weekMessages    = weekConvos.reduce((s, c) => s + (c.message_count || 0), 0);
      const todayConvos     = countInRange(convos, 'created_at', todayStart, todayEnd);
      const uniqueVisitors  = new Set(convos.map(c => c.visitor_id).filter(Boolean)).size;

      // Engagement rate = conversations / views (capped at 100%)
      const engagementRate  = totalViews > 0
        ? Math.min(100, Math.round((totalConvos / totalViews) * 100))
        : 0;

      // ── 7-day daily breakdown — views AND convos ──────────────────────
      const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
        const daysAgo  = 6 - i;
        const dayStart = new Date(now); dayStart.setDate(dayStart.getDate() - daysAgo); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
        return {
          label:  getDayLabel(daysAgo),
          views:  countInRange(views,  'created_at', dayStart, dayEnd),
          convos: countInRange(convos, 'created_at', dayStart, dayEnd),
        };
      });

      // ── Hourly breakdown (6 × 4-hour blocks) ─────────────────────────
      const hourBuckets = Array(24).fill(0);
      views.forEach(v => { hourBuckets[new Date(v.created_at).getHours()]++; });
      const hourlyRaw = [
        { label: '12am–4am',  count: hourBuckets.slice(0,  4).reduce((a,b)=>a+b,0) },
        { label: '4am–8am',   count: hourBuckets.slice(4,  8).reduce((a,b)=>a+b,0) },
        { label: '8am–12pm',  count: hourBuckets.slice(8,  12).reduce((a,b)=>a+b,0) },
        { label: '12pm–4pm',  count: hourBuckets.slice(12, 16).reduce((a,b)=>a+b,0) },
        { label: '4pm–8pm',   count: hourBuckets.slice(16, 20).reduce((a,b)=>a+b,0) },
        { label: '8pm–12am',  count: hourBuckets.slice(20, 24).reduce((a,b)=>a+b,0) },
      ];
      const maxHourly = Math.max(...hourlyRaw.map(h => h.count), 1);
      const hourlyBreakdown = hourlyRaw.map(h => ({ ...h, pct: Math.round((h.count / maxHourly) * 100) }));

      // ── Referrer breakdown ────────────────────────────────────────────
      const refMap = {};
      views.forEach(v => {
        let ref = 'Direct';
        if (v.referrer) {
          try {
            const url = new URL(v.referrer);
            ref = url.hostname.replace('www.', '');
          } catch { ref = v.referrer.slice(0, 40); }
        }
        refMap[ref] = (refMap[ref] || 0) + 1;
      });
      const topReferrers = Object.entries(refMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => ({ source, count, pct: Math.round((count / Math.max(totalViews, 1)) * 100) }));

      setStats({
        totalViews, uniqueViewers, todayViews, weekViews,
        totalConvos, totalMessages, weekMessages, todayConvos, weekConvos: weekConvos.length,
        uniqueVisitors, engagementRate,
        avgMessagesPerConvo: totalConvos > 0 ? (totalMessages / totalConvos).toFixed(1) : 0,
        dailyBreakdown, hourlyBreakdown, topReferrers,
      });

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
    if (messages) setConversationMessages(messages);
    setLoadingMessages(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const maxDailyViews  = Math.max(...stats.dailyBreakdown.map(d => d.views),  1);
  const maxDailyConvos = Math.max(...stats.dailyBreakdown.map(d => d.convos), 1);
  const maxDaily = Math.max(maxDailyViews, maxDailyConvos, 1);

  const viewStatCards = [
    { label: 'Total Page Views',   value: stats.totalViews,     sub: `${stats.weekViews} this week`,   icon: Eye,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'hover:border-blue-500/30' },
    { label: 'Unique Visitors',    value: stats.uniqueViewers,  sub: 'distinct visitor IDs',            icon: Users,        color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/30' },
    { label: 'Views Today',        value: stats.todayViews,     sub: `${stats.todayConvos} chats today`,icon: Calendar,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'hover:border-cyan-500/30' },
    { label: 'Engagement Rate',    value: `${stats.engagementRate}%`, sub: 'views → conversations',    icon: MousePointer2, color: 'text-green-400', bg: 'bg-green-500/10',  border: 'hover:border-green-500/30' },
    { label: 'Total Conversations',value: stats.totalConvos,    sub: `${stats.weekConvos} this week`,   icon: MessageCircle, color: 'text-[#f46530]', bg: 'bg-[#f46530]/10', border: 'hover:border-[#f46530]/30' },
    { label: 'Total Messages',     value: stats.totalMessages,  sub: `${stats.weekMessages} this week`, icon: BarChart3,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'hover:border-amber-500/30' },
    { label: 'Avg Msgs / Chat',    value: stats.avgMessagesPerConvo, sub: 'per conversation',           icon: TrendingUp,   color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'hover:border-pink-500/30' },
    { label: 'Unique Chatters',    value: stats.uniqueVisitors, sub: 'distinct visitor IDs',            icon: Zap,          color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'hover:border-emerald-500/30' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <UpgradePrompt />

      <h1 className="text-3xl font-black text-white mb-10 flex items-center gap-3">
        Analytics
        <Sparkles size={20} className="text-[#f46530]" />
      </h1>

      {/* ── Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {viewStatCards.map((stat, i) => (
          <div
            key={i}
            className={`bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 transition-all group ${stat.border}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${stat.bg}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Conversations list + Transcript ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 flex flex-col h-[600px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[#f46530]" />
            Recent Conversations
            <span className="ml-auto text-xs font-normal text-gray-500">{conversations.length} shown</span>
          </h3>
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
              {conversations.map((convo) => {
                const visitorLabel = convo.visitor_name
                  ? convo.visitor_name
                  : convo.visitor_id
                    ? `Visitor ${convo.visitor_id.slice(0, 8)}`
                    : 'Anonymous';
                const isSelected = selectedConversation === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => loadConversationMessages(convo.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                      isSelected
                        ? 'bg-[#f46530]/10 border border-[#f46530]/30 shadow-[0_0_15px_rgba(244,101,48,0.1)]'
                        : 'bg-gray-900/50 border border-gray-700/50 hover:border-[#f46530]/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#f46530]/20' : 'bg-gray-800 group-hover:bg-gray-700'
                      }`}>
                        <User size={18} className={isSelected ? 'text-[#f46530]' : 'text-gray-400'} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${isSelected ? 'text-[#f46530]' : 'text-white'}`}>{visitorLabel}</p>
                        {convo.visitor_email && <p className="text-xs text-gray-500">{convo.visitor_email}</p>}
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><MessageCircle size={12} />{convo.message_count || 0} msgs</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{formatDate(convo.created_at)}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`transition-transform ${isSelected ? 'text-[#f46530] translate-x-1' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 flex flex-col h-[600px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Bot size={18} className="text-[#f46530]" />
            Conversation Transcript
          </h3>
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                <MessageCircle className="text-gray-600" size={28} />
              </div>
              <p className="text-gray-400">Select a conversation</p>
              <p className="text-gray-500 text-sm mt-1">Click any conversation to read the full transcript</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#f46530] animate-spin" />
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">No messages saved for this conversation</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {conversationMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    msg.role === 'user' ? 'bg-gray-800 border-gray-700' : 'bg-[#f46530]/10 border-[#f46530]/20'
                  }`}>
                    {msg.role === 'user' ? <User size={14} className="text-gray-400" /> : <Bot size={14} className="text-[#f46530]" />}
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

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* 7-day dual bar chart: views + conversations */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 hover:border-cyan-500/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Last 7 Days</h3>
            <span className="text-xs text-gray-500 font-mono">{stats.weekViews} views · {stats.weekConvos} chats</span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-cyan-500/80 inline-block" />Views</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#f46530]/80 inline-block" />Chats</span>
          </div>
          <div className="h-44 flex items-end justify-between gap-2 px-1">
            {stats.dailyBreakdown.map((day, i) => {
              const viewH  = Math.max((day.views  / maxDaily) * 100, day.views  > 0 ? 3 : 0);
              const convoH = Math.max((day.convos / maxDaily) * 100, day.convos > 0 ? 3 : 0);
              return (
                <div key={i} className="flex-1 flex items-end justify-center gap-0.5 h-full group relative">
                  {/* Views bar */}
                  <div
                    className="flex-1 bg-cyan-500/70 rounded-t-md transition-all duration-700 group-hover:bg-cyan-400"
                    style={{ height: `${viewH}%` }}
                  />
                  {/* Chats bar */}
                  <div
                    className="flex-1 bg-[#f46530]/70 rounded-t-md transition-all duration-700 group-hover:bg-[#f46530]"
                    style={{ height: `${convoH}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1.5 px-2.5 rounded-lg border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    {day.views} view{day.views !== 1 ? 's' : ''} · {day.convos} chat{day.convos !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 px-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {stats.dailyBreakdown.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
          {stats.totalViews === 0 && (
            <p className="text-center text-xs text-gray-600 mt-3">Chart will populate once visitors start viewing your page</p>
          )}
        </div>

        {/* Active Hours */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 hover:border-purple-500/20 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Peak View Hours</h3>
            <span className="text-xs text-gray-500 font-mono">all-time · {stats.totalViews} views</span>
          </div>
          {stats.totalViews === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Clock className="text-gray-700 mb-3" size={32} />
              <p className="text-gray-500 text-sm">No view data yet</p>
              <p className="text-gray-600 text-xs mt-1">Active hours appear once visitors land on your page</p>
            </div>
          ) : (
            <div className="space-y-5">
              {stats.hourlyBreakdown.map((slot, i) => {
                const colors = ['bg-purple-500','bg-cyan-500','bg-[#f46530]','bg-green-500','bg-amber-500','bg-pink-500'];
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-sm text-white flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors[i]}`} />
                        {slot.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{slot.count} view{slot.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div className={`h-full rounded-full transition-all duration-700 ${colors[i]}`} style={{ width: `${slot.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Referrer Breakdown ──────────────────────────────────────────── */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-20 hover:border-blue-500/20 transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye size={18} className="text-blue-400" />
            Traffic Sources
          </h3>
          <span className="text-xs text-gray-500 font-mono">{stats.topReferrers.length} sources</span>
        </div>
        {stats.topReferrers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Eye className="text-gray-700 mb-3" size={32} />
            <p className="text-gray-500 text-sm">No referrer data yet</p>
            <p className="text-gray-600 text-xs mt-1">Sources will appear once visitors land on your page</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topReferrers.map((ref, i) => (
              <div key={i} className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white truncate max-w-[140px]" title={ref.source}>{ref.source}</span>
                  <span className="text-xs font-mono text-blue-400 ml-2 shrink-0">{ref.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${ref.pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{ref.count} view{ref.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
