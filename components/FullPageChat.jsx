'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  User, 
  Bot, 
  Sparkles, 
  MessageSquare, 
  ChevronRight, 
  Share2,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Globe
} from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/utils/supabase/client';

export default function FullPageChat({ 
  username, 
  agentConfig,
  profile
}) {
  const supabase = createClient();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [gatekeeperForm, setGatekeeperForm] = useState({ name: '', email: '', password: '' });
  const [gatekeeperError, setGatekeeperError] = useState('');
  const [gatekeeperStep, setGatekeeperStep] = useState('form');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: agentConfig.welcome_message || `Hi! I'm ${agentConfig.agent_name || 'q-agent'}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  // ─── Visual customization helpers ──────────────────────────────────────────
  const fontFamily = agentConfig.font_family || 'Inter';
  const chatBg = agentConfig.chat_bg_color || '#0a0a0f';
  const userBubbleBg = agentConfig.user_bubble_color || 'rgba(255,255,255,0.1)';
  const aiBubbleBg = agentConfig.ai_bubble_color || 'rgba(59,130,246,0.12)';
  const ctaBtnColor = agentConfig.cta_button_color || '#f46530';
  const ctaTextColor = agentConfig.cta_text_color || '#ffffff';
  const preChatTextColor = agentConfig.pre_chat_text_color || '#9ca3af';
  const gatekeeperTextColor = agentConfig.gatekeeper_text_color || '#9ca3af';

  // Load Google Font dynamically
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Inter') return;
    const fontSlug = fontFamily.replace(/ /g, '+');
    const linkId = `gfont-${fontSlug}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontSlug}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
  }, [fontFamily]);
  // ───────────────────────────────────────────────────────────────────────────

  // Visitor ID Tracking + Page View
  const [visitorId, setVisitorId] = useState(null);
  useEffect(() => {
    let vid = localStorage.getItem('qlynk_visitor_id');
    if (!vid) {
      vid = `visitor_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('qlynk_visitor_id', vid);
    }
    setVisitorId(vid);

    // ── Fire a page view once per session per username ──────────────────
    const sessionKey = `qlynk_viewed_${username}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          visitor_id: vid,
          referrer: document.referrer || null,
        }),
      }).catch(() => {}); // fire-and-forget, never block the UI
    }
    // ────────────────────────────────────────────────────────────────────

    // Check auth status
    if (agentConfig?.id) {
      const auth = localStorage.getItem(`qlynk_authorized_${agentConfig.id}`);
      const savedName = localStorage.getItem(`qlynk_visitor_name_${agentConfig.id}`);
      if (auth === 'true' && savedName) {
        setIsAuthorized(true);
        setGatekeeperForm(prev => ({ ...prev, name: savedName }));
      }
    }
  }, [agentConfig?.id]);

  const authorizeVisitor = () => {
    if (agentConfig?.id) {
      localStorage.setItem(`qlynk_visitor_name_${agentConfig.id}`, gatekeeperForm.name);
      if (agentConfig.access_level === 'email') {
        localStorage.setItem(`qlynk_visitor_email_${agentConfig.id}`, gatekeeperForm.email);
      }
      localStorage.setItem(`qlynk_authorized_${agentConfig.id}`, 'true');
    }
    setIsAuthorized(true);
    setShowGatekeeper(false);
    setIsChatOpen(true);
  };

  const handleGatekeeperSubmit = (e) => {
    e.preventDefault();
    setGatekeeperError('');

    if (!gatekeeperForm.name.trim()) {
      setGatekeeperError('Please enter your name.');
      return;
    }

    const accessLevel = agentConfig?.access_level || 'public';

    if (accessLevel === 'password') {
      if (gatekeeperForm.password !== agentConfig?.access_password) {
        setGatekeeperError('Incorrect password.');
        return;
      }
    }

    if (accessLevel === 'email') {
      if (!gatekeeperForm.email.trim() || !gatekeeperForm.email.includes('@')) {
        setGatekeeperError('Please enter a valid email.');
        return;
      }
      // For now, simulate email verification by just authorizing them
      // In a full implementation, we would send a magic link here
      authorizeVisitor();
      return;
    }

    authorizeVisitor();
  };

  useEffect(() => {
    if (scrollRef.current && isChatOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isChatOpen]);

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
          username: username,
          visitorId: visitorId,
          conversationId: conversationId,
          visitorName: gatekeeperForm.name,
          visitorEmail: gatekeeperForm.email
        })
      });

      const headerConvId = response.headers.get('x-conversation-id');
      if (headerConvId && !conversationId) {
        setConversationId(headerConvId);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to AI');
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
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantId ? { ...msg, content: assistantContent } : msg
                ));
              }
            } catch (e) { }
          }
        }
      }

      if (assistantContent) {
        const finalConvId = conversationId || headerConvId;
        if (finalConvId) {
          await supabase.from('agent_messages').insert({
            conversation_id: finalConvId,
            role: 'assistant',
            content: assistantContent
          });
        }
      }
    } catch (error) {
      console.error('[Library-Free-Chat] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSocialIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'twitter': case 'x': return <Twitter className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: chatBg, fontFamily: `'${fontFamily}', sans-serif` }}>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div className="grid-overlay" />
      </div>

      <AnimatePresence mode="wait">
        {/* ── LANDING ─────────────────────────────────────────────────────── */}
        {!isChatOpen && !showGatekeeper ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 w-full max-w-2xl mx-auto px-6 py-20 flex flex-col items-center"
          >
            {/* Profile Card */}
            <div className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/20" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <img 
                      src={agentConfig.agent_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
                      alt={profile?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0a0a0f] shadow-lg" />
                </div>

                <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                  {agentConfig.agent_name || username}
                </h1>
                <p className="font-bold uppercase tracking-widest text-xs mb-6 px-4 py-1.5 rounded-full border"
                   style={{ color: ctaBtnColor, background: `${ctaBtnColor}1a`, borderColor: `${ctaBtnColor}33` }}>
                  {agentConfig.profession || 'Digital Creator'}
                </p>
                
                <p className="text-lg leading-relaxed mb-10 max-w-md mx-auto font-medium" style={{ color: preChatTextColor }}>
                  {agentConfig.bio || `I'm ${agentConfig.agent_name}, the official digital twin of ${username}. Ask me anything about my work or background.`}
                </p>

                {/* Social Links - Use agentConfig links first, fallback to profile table */}
                <div className="flex gap-4 mb-12">
                  {(agentConfig.social_links?.length > 0 ? agentConfig.social_links : profile?.social_links)?.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:-translate-y-1 transition-all"
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${agentConfig.agent_name} | Qlynk`,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary CTA */}
                <button 
                  onClick={() => {
                    if (isAuthorized) {
                      setIsChatOpen(true);
                    } else {
                      setShowGatekeeper(true);
                    }
                  }}
                  className="w-full py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all group/btn overflow-hidden relative"
                  style={{ background: ctaBtnColor, color: ctaTextColor, boxShadow: `0 25px 50px -12px ${ctaBtnColor}33` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  <MessageSquare className="w-6 h-6" />
                  Chat with AI Clone
                  <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Featured Projects / Custom Links */}
            {profile?.custom_links?.length > 0 && (
              <div className="w-full mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.custom_links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gray-500 group-hover:text-[#f46530] transition-colors" />
                      </div>
                      <span className="font-bold text-white text-sm">{link.title}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            )}

            {/* Powered by Branding */}
            <div className="mt-12 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Powered by</span>
              <Image src="/logoWhite.svg" alt="qlynk logo" width={60} height={18} className="h-auto" />
            </div>
          </motion.div>

        /* ── GATEKEEPER ───────────────────────────────────────────────────── */
        ) : showGatekeeper ? (
          <motion.div
            key="gatekeeper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 w-full max-w-2xl mx-auto px-6 py-20 flex flex-col items-center"
          >
            <div className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32" style={{ background: `${ctaBtnColor}1a` }} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-700/50 shadow-xl">
                  <User className="w-10 h-10" style={{ color: ctaBtnColor }} />
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome</h2>
                <p className="mb-8 max-w-md" style={{ color: gatekeeperTextColor }}>
                  Please introduce yourself before chatting with {agentConfig.agent_name}.
                </p>

                <form onSubmit={handleGatekeeperSubmit} className="w-full space-y-4 max-w-sm mx-auto text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={gatekeeperForm.name}
                      onChange={(e) => setGatekeeperForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="What should I call you?"
                      className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                    />
                  </div>

                  {agentConfig.access_level === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Your Email</label>
                      <input
                        type="email"
                        value={gatekeeperForm.email}
                        onChange={(e) => setGatekeeperForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="hello@example.com"
                        className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                      />
                    </div>
                  )}

                  {agentConfig.access_level === 'password' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Access Password</label>
                      <input
                        type="password"
                        value={gatekeeperForm.password}
                        onChange={(e) => setGatekeeperForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter the secret password"
                        className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                      />
                    </div>
                  )}

                  {gatekeeperError && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">
                      {gatekeeperError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold mt-4 transition-all shadow-lg flex justify-center items-center gap-2"
                    style={{ background: ctaBtnColor, color: ctaTextColor }}
                  >
                    Continue to Chat <ChevronRight size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowGatekeeper(false)}
                    className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm font-medium mt-2"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </motion.div>

        /* ── CHAT ─────────────────────────────────────────────────────────── */
        ) : (
          <motion.main 
            key="chat"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 relative z-10 overflow-hidden flex flex-col animate-in fade-in duration-500"
          >
            {/* Chat Header */}
            <header className="px-6 py-4 border-b border-white/10 backdrop-blur-md bg-[#0a0a0f]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsChatOpen(false)} className="mr-2 p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
                    <img src={agentConfig.agent_avatar} alt={agentConfig.agent_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">{agentConfig.agent_name}</h1>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-widest font-black">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    AI Clone Active
                  </p>
                </div>
              </div>
            </header>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
            >
              <div className="max-w-3xl mx-auto space-y-8 pb-32">
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
                        <div
                          className={`inline-block px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed backdrop-blur-xl text-white ${m.role === 'assistant' ? 'w-full' : ''}`}
                          style={m.role === 'user'
                            ? { background: userBubbleBg, border: '1px solid rgba(255,255,255,0.2)' }
                            : { background: aiBubbleBg, border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 20px rgba(59,130,246,0.1)' }
                          }>
                          {m.role === 'user' ? (
                            m.content
                          ) : (
                            <div className="markdown-content">
                              <ReactMarkdown
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0 text-white" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 first:mt-0 text-blue-200" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-md font-bold mt-3 mb-2 first:mt-0 text-blue-300" {...props} />,
                                  p: ({node, ...props}) => <p className="leading-relaxed mb-3 last:mb-0" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 last:mb-0" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 last:mb-0" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                                }}
                              >
                                {m.content || (isLoading && m.id === messages[messages.length-1].id ? '...' : '')}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && !messages[messages.length-1].content && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-4 items-center bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                      <Loader2 className="w-5 h-5 animate-spin text-[#f46530]" />
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input Container */}
            <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent z-50">
              <div className="max-w-3xl mx-auto relative group">
                <form 
                  onSubmit={handleSubmit}
                  className="relative flex items-center z-50"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask anything...`}
                    className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl py-5 pl-6 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-[#f46530]/50 transition-all placeholder:text-gray-500 shadow-2xl relative z-10"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-3 p-3 bg-[#f46530] rounded-xl transition-all disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center z-20 cursor-pointer"
                  >
                    <Send size={24} className="text-white" />
                  </button>
                </form>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
