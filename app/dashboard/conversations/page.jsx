'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import { 
  MessageSquare, 
  Users, 
  ChevronRight,
  ChevronDown,
  Bot,
  User,
  Calendar,
  Filter
} from 'lucide-react';

export default function ConversationsPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const supabase = createClient();
        
        const { data } = await supabase
          .from('agent_conversations')
          .select('*')
          .eq('agent_owner_id', user.id)
          .order('started_at', { ascending: false });

        setConversations(data || []);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const loadMessages = async (conversationId) => {
    if (selectedConvo === conversationId) {
      setSelectedConvo(null);
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setSelectedConvo(conversationId);

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getFilteredConversations = () => {
    if (filter === 'all') return conversations;

    const now = new Date();
    const filterDate = new Date();

    if (filter === 'today') {
      filterDate.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }

    return conversations.filter(c => new Date(c.started_at) >= filterDate);
  };

  const filteredConversations = getFilteredConversations();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Conversations</h1>
          <p className="text-gray-400">View chat history between visitors and your q-agent</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#f46530] transition-colors"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
          <div className="text-xl sm:text-2xl font-black text-white">{conversations.length}</div>
          <div className="text-xs sm:text-sm text-gray-400">Total Conversations</div>
        </div>
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
          <div className="text-xl sm:text-2xl font-black text-white">
            {conversations.reduce((sum, c) => sum + (c.message_count || 0), 0)}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">Total Messages</div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
          <div className="text-xl sm:text-2xl font-black text-white">{filteredConversations.length}</div>
          <div className="text-xs sm:text-sm text-gray-400">Showing</div>
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="space-y-3">
          {filteredConversations.map((convo) => (
            <div key={convo.id} className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
              {/* Conversation Header */}
              <button
                onClick={() => loadMessages(convo.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-800/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-gray-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      Visitor {convo.visitor_id ? `#${convo.visitor_id.slice(0, 8)}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {convo.message_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(convo.started_at).toLocaleDateString()}
                      </span>
                      {convo.visitor_location && (
                        <span className="truncate max-w-[100px]">{convo.visitor_location}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {convo.sentiment && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      convo.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                      convo.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      'bg-gray-500/10 text-gray-400 border border-gray-600/30'
                    }`}>
                      {convo.sentiment}
                    </span>
                  )}
                  {selectedConvo === convo.id ? (
                    <ChevronDown className="text-gray-400" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-400" size={20} />
                  )}
                </div>
              </button>

              {/* Messages Panel */}
              {selectedConvo === convo.id && (
                <div className="border-t border-gray-700/50 bg-gray-900/50 p-5">
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={`flex items-start gap-3 ${
                            msg.role === 'assistant' ? '' : 'flex-row-reverse'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'assistant' 
                              ? 'bg-[#f46530]/20 border border-[#f46530]/30' 
                              : 'bg-gray-700 border border-gray-600'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <Bot size={16} className="text-[#f46530]" />
                            ) : (
                              <User size={16} className="text-gray-400" />
                            )}
                          </div>
                          <div className={`max-w-[80%] p-3 rounded-xl ${
                            msg.role === 'assistant'
                              ? 'bg-gray-800/60 border border-gray-700/50'
                              : 'bg-[#f46530]/10 border border-[#f46530]/20'
                          }`}>
                            <p className="text-white text-sm">{msg.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">No messages in this conversation</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
            <MessageSquare className="text-gray-500" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Conversations Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Once visitors start chatting with your q-agent, their conversations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
