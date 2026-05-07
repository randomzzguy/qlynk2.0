'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bot, Sparkles, Brain, MessageSquare, Zap, Shield, BarChart3, ChevronUp, Users, Heart, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';

// ====== Animated Components ======

const GlowingOrb = ({ top, left, size = 300, color = 'orange', delay = 0 }) => (
  <motion.div
    className="absolute rounded-full opacity-20 blur-3xl pointer-events-none z-0"
    style={{
      top,
      left,
      width: size,
      height: size,
      background: color === 'orange'
        ? `radial-gradient(circle, #f46530, transparent 70%)`
        : 'radial-gradient(circle, #2AB59E, transparent 70%)',
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

// ====== AI Agent Demo Hero Component ======
const AgentDemoHero = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [phase, setPhase] = useState('typing'); // 'typing' | 'done'
  const [displayedResponse, setDisplayedResponse] = useState('');

  const conversations = [
    {
      question: "What does Sarah specialize in?",
      answer: "Sarah is a full-stack developer with 5+ years of experience in React, Node.js, and cloud architecture. She's particularly passionate about building scalable SaaS products.",
      name: "Sarah Chen",
      role: "Full-Stack Developer"
    },
    {
      question: "Can I book a consultation with Alex?",
      answer: "Absolutely! Alex offers free 30-minute discovery calls. You can book directly at calendly.com/alex-design or I can share his availability for this week.",
      name: "Alex Rivera",
      role: "UX Designer"
    },
    {
      question: "What projects has Jordan worked on?",
      answer: "Jordan has led development on 3 successful startups, including a fintech app with 50k+ users and an AI-powered analytics platform. Check out the portfolio section for case studies!",
      name: "Jordan Kim",
      role: "Startup Founder"
    }
  ];

  // Re-run the whole typing sequence every time currentMessage changes
  useEffect(() => {
    setDisplayedResponse('');
    setPhase('typing');

    const answer = conversations[currentMessage].answer;
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      charIndex++;
      setDisplayedResponse(answer.slice(0, charIndex));
      if (charIndex >= answer.length) {
        clearInterval(typingInterval);
        setPhase('done');
      }
    }, 22);

    return () => clearInterval(typingInterval);
  }, [currentMessage]);

  // After the answer finishes, pause then advance to the next conversation
  useEffect(() => {
    if (phase !== 'done') return;
    const pauseTimer = setTimeout(() => {
      setCurrentMessage((prev) => (prev + 1) % conversations.length);
    }, 3500);
    return () => clearTimeout(pauseTimer);
  }, [phase]);

  const currentConvo = conversations[currentMessage];

  return (
    <div className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-[#f46530] bg-gray-800/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot size={20} className="text-[#f46530]" />
            </motion.span>
            <span className="text-sm font-bold tracking-wide text-[#f46530]">
              THE AGENTIC HUB
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your Personal <span className="bg-gradient-to-r from-[#f46530] to-[#c14f22] bg-clip-text text-transparent">AI Ambassador</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Create an AI agent that knows everything about you. Let visitors chat with your digital twin 24/7 while you focus on what matters.
          </motion.p>
        </div>

        {/* Main Content: Description + Live Demo */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Value Props */}
          <div className="space-y-8">
            <motion.div
              className="p-8 rounded-3xl bg-gray-800/50 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f46530]/20 flex items-center justify-center text-[#f46530] shrink-0">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Train Your Agent</h3>
                    <p className="text-gray-400">Upload your bio, resume, projects, and expertise. Your Q-Agent learns everything about you.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f46530]/20 flex items-center justify-center text-[#f46530] shrink-0">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">24/7 Conversations</h3>
                    <p className="text-gray-400">Visitors can ask questions, request info, or book meetings - your agent handles it all.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f46530]/20 flex items-center justify-center text-[#f46530] shrink-0">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Track Everything</h3>
                    <p className="text-gray-400">See what visitors ask, popular topics, and conversation insights in your dashboard.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="text-center space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.a
                href="/auth/signup"
                className="px-12 py-6 rounded-xl text-xl font-bold bg-[#f46530] text-white shadow-lg shadow-[#f46530]/30 inline-block w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create Your Q-Agent Free
              </motion.a>
              <div className="flex items-center justify-center gap-6 text-sm flex-wrap text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-[#f46530]">&#10003;</span>
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-[#f46530]">&#10003;</span>
                  <span>No charge today</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-[#f46530]">&#10003;</span>
                  <span>5 min setup</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Live Agent Demo */}
          <motion.div
            className="lg:sticky lg:top-24"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="mb-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f46530]/10 border border-[#f46530]/20 text-[#f46530] font-bold text-sm">
                <Sparkles size={16} />
                LIVE DEMO
              </div>
            </div>

            <motion.div
              className="rounded-3xl bg-white shadow-2xl overflow-hidden border-4 border-gray-700"
              key={currentMessage}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Mock Browser Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b-2 border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400 font-mono">
                  qlynk.site/{currentConvo.name.split(' ')[0].toLowerCase()}
                </div>
              </div>

              {/* Chat Demo Content */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 min-h-[480px] flex flex-col">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f46530] to-[#c14f22] flex items-center justify-center text-2xl text-white font-bold">
                    {currentConvo.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentConvo.name}</h3>
                    <p className="text-gray-400">{currentConvo.role}</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-4 overflow-hidden">
                  {/* User Message */}
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-[#f46530] text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                      <p className="text-sm">{currentConvo.question}</p>
                    </div>
                  </motion.div>

                  {/* Agent Response */}
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="bg-gray-700 text-white px-4 py-3 rounded-2xl rounded-tl-md max-w-[85%]">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={16} className="text-[#f46530]" />
                        <span className="text-xs font-semibold text-[#f46530]">Q-Agent</span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {displayedResponse}
                        {phase === 'typing' && <span className="inline-block w-1 h-4 bg-[#f46530] ml-1 animate-pulse"></span>}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Chat Input Mock */}
                <div className="mt-4 flex items-center gap-2 bg-gray-700/50 rounded-xl p-2">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-gray-500"
                    disabled
                  />
                  <button className="bg-[#f46530] text-white p-2 rounded-lg">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.p
              className="text-center text-sm text-gray-400 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              This could be your AI agent in 5 minutes
            </motion.p>
          </motion.div>
        </div>

        {/* Use Case Cards */}
        <motion.div
          className="grid sm:grid-cols-3 gap-6 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.4 }}
        >
          <motion.div
            className="p-6 rounded-2xl border border-gray-700 bg-gray-800/50 hover:border-[#f46530] transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-3"><Bot /></div>
            <div className="font-bold mb-2 text-white">Freelancers</div>
            <div className="text-sm text-gray-400">Let clients learn about your services 24/7</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-2xl border border-gray-700 bg-gray-800/50 hover:border-[#f46530] transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-3"><Users /></div>
            <div className="font-bold mb-2 text-white">Founders</div>
            <div className="text-sm text-gray-400">Answer investor and customer questions automatically</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-2xl border border-gray-700 bg-gray-800/50 hover:border-[#f46530] transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-3"><Sparkles /></div>
            <div className="font-bold mb-2 text-white">Creators</div>
            <div className="text-sm text-gray-400">Engage your audience with personalized AI interactions</div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// ====== About Us Section ======
const AboutUs = () => {
  const values = [
    { icon: Users, title: "Our Community", desc: "Built for creators, founders, and professionals who want to scale their personal presence." },
    { icon: Heart, title: "Our Passion", desc: "We believe everyone deserves an AI that represents them authentically online." },
    { icon: Target, title: "Our Mission", desc: "To give everyone the power of 24/7 personal representation through intelligent AI agents." }
  ];

  return (
    <section className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            className="lg:w-1/2 space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange/10 border border-orange/20 text-orange font-bold text-sm">
              <Users size={16} />
              WHO WE ARE
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Pioneering the future of <span className="text-orange">personal AI</span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Qlynk started with a vision: what if you could clone your expertise into an AI that works for you around the clock? We made it real with Q-Agent - your intelligent digital ambassador.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 pt-4">
              <div className="text-center p-4 rounded-2xl bg-gray-800/40 border border-gray-700">
                <div className="text-3xl font-black text-orange mb-1">AI</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Powered</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-gray-800/40 border border-gray-700">
                <div className="text-3xl font-black text-orange mb-1">24/7</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Available</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-gray-800/40 border border-gray-700">
                <div className="text-3xl font-black text-orange mb-1">You</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">In Control</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:w-1/2 grid grid-cols-1 gap-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {values.map((v, i) => (
              <div key={i} className="flex gap-6 p-8 rounded-3xl bg-gray-800/30 border border-gray-700 hover:border-orange/30 transition-all group">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-orange/10 flex items-center justify-center text-orange group-hover:bg-orange group-hover:text-white transition-all">
                  <v.icon size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ====== Scroll To Top Component ======
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-orange text-white shadow-2xl shadow-orange/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          aria-label="Scroll to top"
        >
          <ChevronUp size={28} className="group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ====== Main App ======
export default function App() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // Typing effect
  useEffect(() => {
    const words = ['Freelancers', 'Founders', 'Creators', 'Consultants', 'Coaches', 'Everyone'];
    const TYPE_SPEED = 90;
    const DELETE_SPEED = 45;
    const PAUSE_BEFORE_DELETE = 700;
    const PAUSE_BEFORE_TYPE = 300;

    const i = loopNum % words.length;
    const fullText = words[i];

    if (!isDeleting && text === fullText) {
      const timer = setTimeout(() => setIsDeleting(true), PAUSE_BEFORE_DELETE);
      return () => clearTimeout(timer);
    }

    if (isDeleting && text === '') {
      const timer = setTimeout(() => {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }, PAUSE_BEFORE_TYPE);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setText(isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1)
      );
    }, isDeleting ? DELETE_SPEED : TYPE_SPEED);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum]);

  const features = [
    { icon: Brain, title: "Train Your Knowledge", desc: "Upload your bio, resume, projects, and expertise. Your Q-Agent learns everything about you instantly." },
    { icon: MessageSquare, title: "Smart Conversations", desc: "Powered by advanced AI, your agent answers questions naturally and accurately about you." },
    { icon: Shield, title: "Your Brand, Your Rules", desc: "Customize your agent's personality, responses, and appearance to match your personal brand." },
    { icon: BarChart3, title: "Actionable Insights", desc: "See what visitors ask, track engagement, and understand what people want to know about you." }
  ];

  const steps = [
    { num: "1", title: "Create Your Agent", desc: "Sign up and claim your unique qlynk.site/username URL in seconds." },
    { num: "2", title: "Train Your Q-Agent", desc: "Add your bio, skills, projects, and upload documents. Your AI learns it all." },
    { num: "3", title: "Share & Engage", desc: "Drop your link anywhere. Visitors chat with your AI while you sleep, work, or play." }
  ];

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden"
    >
      {/* Apply the QlynkBackground component */}
      <QlynkBackground />

      {/* Animated Floating Orbs */}
      <GlowingOrb top="15%" left="5%" size={400} color="orange" delay={0} />
      <GlowingOrb top="75%" left="85%" size={500} color="teal" delay={1} />
      <GlowingOrb top="40%" left="70%" size={300} color="orange" delay={2} />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center justify-center h-16 group">
                <Image
                  src="/logoWhite.svg"
                  alt="qlynk logo"
                  width={125}
                  height={50}
                  priority
                  className="group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/pricing" className="text-gray-300 hover:text-[#f46530] font-medium transition-colors">Pricing</Link>
              <Link href="/auth/login" className="text-gray-300 hover:text-[#f46530] font-medium transition-colors">Log in</Link>
              <motion.a
                href="/auth/signup"
                className="bg-[#f46530] hover:bg-[#c14f22] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:shadow-md transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.a>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-[#f46530] p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden bg-gray-800 border-t border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-3 space-y-2">
                <Link href="/pricing" className="block px-3 py-2 text-gray-300">Pricing</Link>
                <Link href="/auth/login" className="block px-3 py-2 text-gray-300">Log in</Link>
                <Link
                  href="/auth/signup"
                  className="block bg-[#f46530] text-white text-center px-4 py-2.5 rounded-lg font-medium mt-1"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section - AI Agent Demo */}
      <section className="min-h-screen pt-24 pb-20 relative z-10 flex items-center">
        <AgentDemoHero />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-900/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Your AI. Your Rules. Your Growth.</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Everything you need to create your intelligent digital presence.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="group bg-gray-800/50 rounded-2xl p-8 border border-gray-700 hover:border-[#f46530]/50 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-14 h-14 rounded-xl bg-[#f46530]/10 flex items-center justify-center mb-6 text-[#f46530] group-hover:bg-[#f46530]/20 group-hover:text-[#f46530] transition-colors">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#f46530] transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to your personal AI agent</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-1 bg-gray-700 -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="text-center group"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f46530] text-white text-2xl font-black rounded-2xl mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <AboutUs />

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-[#f46530] to-[#c14f22] relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-black text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Clone Yourself?
          </motion.h2>
          <motion.p
            className="text-xl text-[#ffecd9] mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join professionals, creators, and founders who use Q-Agent to engage visitors 24/7 while focusing on what matters most.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#f46530] px-10 py-5 rounded-xl font-bold text-xl shadow-lg hover:bg-gray-100 transition-all"
            >
              Create Your Q-Agent
              <ArrowRight size={24} />
            </Link>
          </motion.div>

          <p className="text-[#ffecd9]/80 text-sm mt-8">
            14-day free trial | No charge today | 5 minute setup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center justify-center mb-8 group">
                <Image
                  src="/logoWhite.svg"
                  alt="qlynk logo"
                  width={125}
                  height={50}
                  priority
                  className="group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>
            <p className="mt-4 md:mt-0">&copy; {new Date().getFullYear()} qlynk. Your AI clone, in a blink.</p>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
