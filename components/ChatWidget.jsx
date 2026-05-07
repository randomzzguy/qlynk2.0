'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatWidget({ 
  username, 
  agentName = 'Q-Agent',
  agentAvatar,
  welcomeMessage = 'Hi! How can I help you today?',
  primaryColor = '#f46530',
  position = 'bottom-right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [visitorId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('qlynk_visitor_id') || crypto.randomUUID()
      : crypto.randomUUID()
  );
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Store visitor ID in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qlynk_visitor_id', visitorId);
    }
  }, [visitorId]);

  // Handle iframe communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const msg = isOpen ? 'qlynk_chat_open' : 'qlynk_chat_closed';
      window.parent.postMessage(msg, '*');
    }
  }, [isOpen]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          username,
          conversationId,
          visitorId,
        },
      }),
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const getMessageText = (message) => {
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('');
    }
    return message.content || '';
  };

  return (
    <div className={`fixed ${positionClasses[position] || positionClasses['bottom-right']} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="mb-4 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ boxShadow: `0 25px 50px -12px ${primaryColor}20` }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              {agentAvatar ? (
                <img 
                  src={agentAvatar} 
                  alt={agentName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={20} />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">{agentName}</h3>
                <p className="text-xs opacity-80">
                  {isLoading ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Bot size={16} style={{ color: primaryColor }} />
                </div>
                <div 
                  className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm"
                >
                  <p className="text-sm text-gray-700">{welcomeMessage}</p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const text = getMessageText(message);
              
              return (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUser ? 'bg-gray-200' : ''
                    }`}
                    style={!isUser ? { backgroundColor: `${primaryColor}20` } : {}}
                  >
                    {isUser ? (
                      <User size={16} className="text-gray-600" />
                    ) : (
                      <Bot size={16} style={{ color: primaryColor }} />
                    )}
                  </div>
                  <div 
                    className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${
                      isUser 
                        ? 'rounded-tr-sm text-white' 
                        : 'bg-white rounded-tl-sm'
                    }`}
                    style={isUser ? { backgroundColor: primaryColor } : {}}
                  >
                    <p className={`text-sm whitespace-pre-wrap ${isUser ? '' : 'text-gray-700'}`}>
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Bot size={16} style={{ color: primaryColor }} />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50"
                style={{ '--tw-ring-color': primaryColor }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by <span className="font-medium">qlynk</span>
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ 
          backgroundColor: primaryColor,
          boxShadow: `0 10px 40px ${primaryColor}50`
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
