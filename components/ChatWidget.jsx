'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatWidget({ 
  username, 
  agentName = 'Your AI',
  agentAvatar,
  welcomeMessage = 'Hi! How can I help you today?',
  primaryColor = '#f46530',
  position = 'bottom-right',
  accessLevel = 'public',
  tier,
  parentOrigin
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [gatekeeperForm, setGatekeeperForm] = useState({ name: '', email: '', password: '' });
  const [gatekeeperError, setGatekeeperError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(accessLevel === 'public');
  const [accessPassword, setAccessPassword] = useState('');
  const [visitorId] = useState(() => {
    const storedId = typeof window !== 'undefined'
      ? localStorage.getItem('qlynk_visitor_id')
      : null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storedId || '');
    return isUuid ? storedId : crypto.randomUUID();
  });
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
      let targetOrigin = parentOrigin;
      if (!targetOrigin && document.referrer) {
        try {
          targetOrigin = new URL(document.referrer).origin;
        } catch {
          return;
        }
      }
      if (!targetOrigin) return;

      const msg = isOpen ? 'qlynk_chat_open' : 'qlynk_chat_closed';
      window.parent.postMessage(msg, targetOrigin);
    }
  }, [isOpen, parentOrigin]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!isAuthorized) {
      setGatekeeperError('Please complete access first.');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          username,
          conversationId,
          visitorId,
          visitorName: gatekeeperForm.name,
          visitorEmail: gatekeeperForm.email,
          accessPassword,
        }),
      });

      const headerConvId = response.headers.get('x-conversation-id');
      if (headerConvId && !conversationId) {
        setConversationId(headerConvId);
      }

      if (!response.ok) {
        const errorData = await response.json();
        const requestError = new Error(errorData.error || 'Failed to connect to AI');
        requestError.status = response.status;
        throw requestError;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(message =>
                  message.id === assistantId
                    ? { ...message, content: assistantContent }
                    : message
                ));
              }
            } catch {
              // Ignore partial stream frames and keep reading.
            }
          }
        }
      }
    } catch (error) {
      console.error('[ChatWidget] Error:', error);
      if (error.status === 403 && accessLevel !== 'public') {
        setIsAuthorized(false);
        setGatekeeperError(error.message);
      }
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: error.message || "Sorry, I couldn't connect right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatekeeperSubmit = (e) => {
    e.preventDefault();
    setGatekeeperError('');

    if (!gatekeeperForm.name.trim()) {
      setGatekeeperError('Please enter your name.');
      return;
    }

    if (accessLevel === 'email' && (!gatekeeperForm.email.trim() || !gatekeeperForm.email.includes('@'))) {
      setGatekeeperError('Please enter a valid email.');
      return;
    }

    if (accessLevel === 'password') {
      if (!gatekeeperForm.password.trim()) {
        setGatekeeperError('Please enter the access password.');
        return;
      }
      setAccessPassword(gatekeeperForm.password);
    }

    setIsAuthorized(true);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const getMessageText = (message) => {
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
                <Image 
                  src={agentAvatar} 
                  alt={agentName}
                  width={40}
                  height={40}
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
            {!isAuthorized && accessLevel !== 'public' ? (
              <form onSubmit={handleGatekeeperSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Your name</label>
                  <input
                    type="text"
                    value={gatekeeperForm.name}
                    onChange={(e) => setGatekeeperForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': primaryColor }}
                  />
                </div>
                {accessLevel === 'email' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={gatekeeperForm.email}
                      onChange={(e) => setGatekeeperForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                )}
                {accessLevel === 'password' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Access password</label>
                    <input
                      type="password"
                      value={gatekeeperForm.password}
                      onChange={(e) => setGatekeeperForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                )}
                {gatekeeperError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {gatekeeperError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                </button>
              </form>
            ) : (
              <>
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
              </>
            )}
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
                disabled={isLoading || !isAuthorized}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50"
                style={{ '--tw-ring-color': primaryColor }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !isAuthorized}
                className="p-2.5 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              AI processed; shared with the agent owner. <a href="https://www.qlynk.site/privacy" target="_blank" rel="noreferrer" className="underline">Privacy</a>
            </p>
            {tier?.toLowerCase() !== 'agency' && tier?.toLowerCase() !== 'business' && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Powered by <span className="font-medium">qlynk</span>
              </p>
            )}
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
