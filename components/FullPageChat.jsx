'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, User, Bot, Sparkles } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';

export default function FullPageChat({ 
  username, 
  agentName, 
  agentAvatar, 
  welcomeMessage, 
  primaryColor = '#f46530' 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage || `Hi! I'm ${agentName || 'Q-Agent'}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
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
          username: username
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to AI');
      }

      // HANDLE STANDARD OPENAI SSE STREAM
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
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantId ? { ...msg, content: assistantContent } : msg
                ));
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('[Library-Free-Chat] Error:', error);
      alert(`Chat Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/10 backdrop-blur-md bg-[#0a0a0f]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
              {agentAvatar ? (
                <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{agentName || 'Q-Agent'}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Active AI Clone
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
          Library-Free Connection
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                      m.role === 'user' 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white/10 border-white/20'
                    }`}>
                      {m.role === 'user' ? (
                        <User className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Bot className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className={`space-y-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-gray-200'
                          : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-gray-100 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                      }`}>
                        {m.content || (m.role === 'assistant' && isLoading ? '...' : '')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && !messages[messages.length-1].content && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-8"
                >
                  <div className="flex gap-4 items-center bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                    <span className="text-sm font-bold text-gray-400">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Container */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent relative z-50">
          <div className="max-w-3xl mx-auto relative group">
            <form 
              onSubmit={handleSubmit}
              className="relative flex items-center z-50"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${agentName} anything...`}
                className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl py-5 pl-6 pr-16 text-lg focus:outline-none focus:ring-2 transition-all placeholder:text-gray-500 shadow-2xl relative z-10"
                style={{ '--tw-ring-color': primaryColor }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 p-3 rounded-xl transition-all disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center z-20 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Send size={24} className="text-white" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
