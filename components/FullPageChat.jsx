'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, User, Bot, Sparkles, ArrowRight } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import QlynkBackground from '@/components/QlynkBackground';

export default function FullPageChat({ 
  username, 
  agentName, 
  agentAvatar, 
  welcomeMessage, 
  primaryColor = '#f46530' 
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { username },
    onError: (error) => {
      console.error('[v0] Chat Error:', error);
      alert('AI connection error. Please check if GROQ_API_KEY is set in .env.local');
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage || `Hi! I'm ${agentName || 'Q-Agent'}. How can I help you today?`
      }
    ]
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/20 p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shadow-lg"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              {agentAvatar ? (
                <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
              ) : (
                <Bot className="text-white" style={{ color: primaryColor }} size={24} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{agentName}</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Sparkles size={14} className="text-yellow-500" />
            <span className="text-xs font-bold text-gray-300">Powered by Qlynk AI</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto py-10">
            <AnimatePresence initial={false}>
              {messages.map((m, index) => (
                <motion.div
                  key={m.id || index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-8`}
                >
                  <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div 
                      className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/10 shadow-md ${
                        m.role === 'user' ? 'bg-gray-800' : ''
                      }`}
                      style={m.role === 'assistant' ? { backgroundColor: `${primaryColor}20` } : {}}
                    >
                      {m.role === 'user' ? <User size={20} /> : <Bot size={20} style={{ color: primaryColor }} />}
                    </div>
                    <div 
                      className={`p-4 md:p-5 rounded-2xl shadow-xl leading-relaxed text-[15px] md:text-base ${
                        m.role === 'user' 
                          ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-tr-none border border-white/5' 
                          : 'bg-white/5 backdrop-blur-xl text-gray-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
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
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <form 
              onSubmit={handleSubmit}
              className="relative flex items-center"
            >
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={`Ask ${agentName} anything...`}
                className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl py-5 pl-6 pr-16 text-lg focus:outline-none focus:ring-2 transition-all placeholder:text-gray-500 shadow-2xl"
                style={{ '--tw-ring-color': primaryColor }}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="absolute right-3 p-3 rounded-xl transition-all disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Send size={24} className="text-white" />
              </button>
            </form>
            <p className="text-center mt-4 text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
              Personal AI Clone • No Human Involved
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .grid-overlay {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
          position: absolute;
          inset: 0;
        }
      `}</style>
    </div>
  );
}
