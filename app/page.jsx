'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bot, Sparkles, Brain, MessageSquare, Shield, BarChart3, ChevronUp, Users, Heart, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';
import { getCurrentUser, getCurrentProfile, signOut } from '@/lib/supabase';

// ====== Animated Components ======

const DEMO_CONVERSATIONS = [
  {
    question: "Which service is best for a new product launch?",
    answer: "Northstar Studio's launch package covers positioning, campaign design, and a rollout plan. Would you like a quick comparison with the smaller strategy package?",
    name: "Northstar Studio",
    role: "Business Guide"
  },
  {
    question: "Where are fresh bath towels stored?",
    answer: "Fresh bath towels are kept in the upstairs linen closet, on the shelves labeled Guest Rooms. Are you preparing one room or doing a full turnover?",
    name: "Harbor House",
    role: "Property Guide"
  },
  {
    question: "How do I invite a teammate to a project?",
    answer: "Open the project, choose Members, then select Invite teammate and enter their work email. Want the steps for changing their access level too?",
    name: "Orbit Console",
    role: "Product Guide"
  }
];

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

  // Re-run the whole typing sequence every time currentMessage changes
  useEffect(() => {
    setDisplayedResponse('');
    setPhase('typing');

    const answer = DEMO_CONVERSATIONS[currentMessage].answer;
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
      setCurrentMessage((prev) => (prev + 1) % DEMO_CONVERSATIONS.length);
    }, 3500);
    return () => clearTimeout(pauseTimer);
  }, [phase]);

  const currentConvo = DEMO_CONVERSATIONS[currentMessage];

  return (
    <div className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-orange/30 bg-orange/10 backdrop-blur-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-5 h-5 flex-shrink-0">
              <Image src="/assets/iconWhite.svg" alt="" width={20} height={20} />
            </div>
            <span className="text-xs font-black tracking-[0.2em] text-orange uppercase">
              One Platform. Many Focused Agents.
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Turn Your Knowledge Into <br />
            <span className="bg-gradient-to-r from-orange via-[#f46530] to-[#c14f22] bg-clip-text text-transparent">an AI Agent</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Build a personal AI, business guide, property assistant, operations trainer, product guide, support agent, or something custom. Give it approved knowledge, clear boundaries, and a link people can use 24/7.
          </motion.p>
        </div>

        {/* Main Content Stage */}
        <div className="relative">
          {/* Background Stage Glow */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] w-[100%] bg-orange/5 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Column - Floating Feature Cards */}
            <div className="lg:col-span-5 space-y-4">
              {[
                {
                  icon: Brain,
                  title: "Choose Its Role",
                  desc: "Start with a personal, business, property, operations, product, support, or custom agent."
                },
                {
                  icon: MessageSquare,
                  title: "Add Trusted Knowledge",
                  desc: "Give it profile context, facts, FAQs, documents, links, and the information it is approved to use."
                },
                {
                  icon: BarChart3,
                  title: "Set Rules and Boundaries",
                  desc: "Define its purpose, audience, allowed topics, blocked topics, behavior, uncertainty, and human handoff."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="p-6 rounded-2xl bg-gray-800/40 backdrop-blur-md border border-white/5 hover:border-orange/30 transition-all duration-300 group"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + (i * 0.1) }}
                >
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-orange shrink-0 group-hover:scale-110 transition-transform">
                      <feature.icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* CTA Integration */}
              <motion.div
                className="pt-6 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange to-[#c14f22] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <motion.a
                    href="/auth/signup"
                    className="relative px-8 py-5 rounded-2xl text-lg font-bold bg-orange text-white flex items-center justify-center gap-3 shadow-xl w-full"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Your Qlynk Agent Free
                    <ArrowRight size={20} />
                  </motion.a>
                </div>

                <div className="flex items-center justify-center gap-4 text-[13px] font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-orange/10 flex items-center justify-center text-orange text-[10px]">✓</div>
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-orange/10 flex items-center justify-center text-orange text-[10px]">✓</div>
                    <span>No charge today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-orange/10 flex items-center justify-center text-orange text-[10px]">✓</div>
                    <span>5 min setup</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Live Agent Demo Stage */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="relative">
                {/* Floating Elements Around Demo */}
                <motion.div 
                  className="absolute -top-6 -right-6 p-4 rounded-2xl bg-gray-800/80 backdrop-blur-xl border border-white/10 shadow-2xl z-20 hidden sm:block"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Interactions</span>
                  </div>
                </motion.div>

                <div className="rounded-[2.5rem] bg-gray-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border-[8px] border-gray-800/80 relative">
                  {/* Mock Browser Header */}
                  <div className="bg-gray-800/50 px-6 py-4 flex items-center gap-3 border-b border-white/5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/10"></div>
                      <div className="w-3 h-3 rounded-full bg-white/10"></div>
                      <div className="w-3 h-3 rounded-full bg-white/10"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-black/20 rounded-full px-4 py-1.5 text-[11px] text-gray-500 font-mono text-center border border-white/5">
                      qlynk.site/{currentConvo.name.split(' ')[0].toLowerCase()}
                    </div>
                  </div>

                  {/* Chat Demo Content */}
                  <div className="bg-[#0c0c12] p-8 min-h-[520px] flex flex-col">
                    {/* Profile Header */}
                    <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-[#c14f22] flex items-center justify-center text-xl text-white font-black shadow-lg shadow-orange/20">
                        {currentConvo.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-none mb-1.5">{currentConvo.name}</h3>
                        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">{currentConvo.role}</p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 space-y-6 overflow-hidden">
                      {/* User Message */}
                      <motion.div
                        className="flex justify-end"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="bg-white/5 border border-white/10 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-xl">
                          <p className="text-sm leading-relaxed">{currentConvo.question}</p>
                        </div>
                      </motion.div>

                      {/* Agent Response */}
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="bg-orange/10 border border-orange/20 text-white px-5 py-3.5 rounded-2xl rounded-tl-sm max-w-[90%] shadow-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Image src="/assets/iconWhite.svg" alt="" width={14} height={14} />
                            <span className="text-[11px] font-black text-orange uppercase tracking-[0.1em]">Qlynk Agent response</span>
                          </div>
                          <p className="text-sm leading-relaxed text-gray-100">
                            {displayedResponse}
                            {phase === 'typing' && <span className="inline-block w-1.5 h-4 bg-orange ml-1.5 animate-pulse rounded-full"></span>}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Chat Input Mock */}
                    <div className="mt-8 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2.5">
                      <div className="flex-1 text-gray-600 text-sm px-4">
                        Ask me anything...
                      </div>
                      <div className="w-10 h-10 bg-orange/20 rounded-xl flex items-center justify-center text-orange">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
            <div className="text-3xl mb-3 text-[#f46530]"><Bot /></div>
            <div className="font-bold mb-2 text-white">People & Experts</div>
            <div className="text-sm text-gray-400">Share experience, services, projects, and approved professional knowledge</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-2xl border border-gray-700 bg-gray-800/50 hover:border-[#f46530] transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-3 text-[#f46530]"><Users /></div>
            <div className="font-bold mb-2 text-white">Businesses & Products</div>
            <div className="text-sm text-gray-400">Explain offerings, answer FAQs, guide setup, and route people to the next step</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-2xl border border-gray-700 bg-gray-800/50 hover:border-[#f46530] transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-3 text-[#f46530]"><Sparkles /></div>
            <div className="font-bold mb-2 text-white">Places & Operations</div>
            <div className="text-sm text-gray-400">Guide guests or teams through locations, procedures, training, and routine work</div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// ====== About Us Section ======
const AboutUs = () => {
  const values = [
    { icon: Users, title: "Built for real use", desc: "From personal expertise and customer questions to property guidance, product help, and team operations." },
    { icon: Heart, title: "Knowledge with boundaries", desc: "Owners choose what the agent knows, what it may discuss, and when it should hand off to a person." },
    { icon: Target, title: "A focused purpose", desc: "Each Qlynk Agent is configured for a defined job instead of acting like an unrestricted general assistant." }
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
              Focused AI agents built around <span className="text-orange">your knowledge</span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Qlynk is a no-code platform for building a governed AI guide around a person, business, place, operation, product, support workflow, or custom purpose.
            </p>
            <Link href="/about" className="inline-flex items-center gap-2 text-orange font-bold hover:underline">
              Learn more about Qlynk AI <ArrowRight size={18} />
            </Link>
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getCurrentProfile();
        setProfile(userProfile);
      }
    };
    fetchUser();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setUserDropdownOpen(false);
  };

  // Auth metadata keeps the navbar useful while the profile row is loading (or
  // if an older account does not have a profile row yet).
  const displayUsername = profile?.username
    || user?.user_metadata?.username
    || user?.email?.split('@')[0]
    || 'User';
  const avatarUrl = profile?.avatar_url
    || user?.user_metadata?.avatar_url
    || user?.user_metadata?.picture
    || null;
  const userInitial = displayUsername.charAt(0).toUpperCase();

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
    { icon: Shield, title: "Purpose & Boundaries", href: "/features/security", desc: "Choose the agent's role, audience, scope, response behavior, blocked topics, and human escalation path." },
    { icon: Brain, title: "Knowledge You Control", href: "/features/knowledge-base", desc: "Organize profile context, facts, FAQs, documents, links, and custom knowledge in one dashboard." },
    { icon: MessageSquare, title: "A Branded Conversation", href: "/features/ai-training", desc: "Give visitors a focused, natural chat experience with your chosen identity, tone, welcome message, and visual style." },
    { icon: BarChart3, title: "Conversations & Insights", href: "/features/analytics", desc: "Review conversations, visitor activity, popular questions, and signals that show where knowledge needs improvement." }
  ];

  const steps = [
    { num: "1", title: "Choose Its Purpose", desc: "Pick the kind of agent you need, define its audience, and give it a clear job." },
    { num: "2", title: "Add Knowledge & Rules", desc: "Provide approved information, set boundaries, and decide how it should respond or escalate." },
    { num: "3", title: "Publish & Improve", desc: "Share your qlynk.site/username link, review real questions, and keep its knowledge current." }
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
                  alt="Qlynk AI logo"
                  width={125}
                  height={50}
                  priority
                  className="group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/ai-agent" className="text-gray-300 hover:text-orange font-medium transition-colors">Product</Link>
              <Link href="/pricing" className="text-gray-300 hover:text-orange font-medium transition-colors">Pricing</Link>
              <Link href="/blog" className="text-gray-300 hover:text-orange font-medium transition-colors">Resources</Link>
              <Link href="/faq" className="text-gray-300 hover:text-orange font-medium transition-colors">FAQ</Link>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-700 hover:border-orange/40 bg-gray-800/60 hover:bg-gray-800 transition-all group"
                  >
                    <div className="relative w-7 h-7 overflow-hidden rounded-lg bg-gradient-to-br from-orange to-[#c14f22] flex items-center justify-center text-white text-xs font-black shadow-md shadow-orange/20">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={`${displayUsername}'s profile`} fill sizes="28px" className="object-cover" />
                      ) : userInitial}
                    </div>
                    <span className="text-sm font-semibold text-white">{displayUsername}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-700/60">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm text-white font-semibold mt-0.5 truncate">{displayUsername}</p>
                        </div>
                        <div className="py-1.5">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-orange/10 transition-all group"
                          >
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                          >
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-300 hover:text-orange font-medium transition-colors">Log in</Link>
                  <motion.a
                    href="/auth/signup"
                    className="bg-orange hover:bg-orange/80 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-orange/20 transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.a>
                </>
              )}
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
              <div className="px-4 py-4 space-y-2">
                <Link href="/ai-agent" className="block px-3 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors">Product</Link>
                <Link href="/pricing" className="block px-3 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors">Pricing</Link>
                <Link href="/blog" className="block px-3 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors">Resources</Link>
                <Link href="/faq" className="block px-3 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors">FAQ</Link>
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-700/40 border border-gray-700">
                      <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-orange to-[#c14f22] flex items-center justify-center text-white text-sm font-black shadow-md">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={`${displayUsername}'s profile`} fill sizes="32px" className="object-cover" />
                        ) : userInitial}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 leading-none">Signed in as</p>
                        <p className="text-sm text-white font-semibold mt-0.5">{displayUsername}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-orange text-white text-center px-4 py-3 rounded-xl font-black hover:bg-orange/90 transition-colors">
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-center px-3 py-2.5 text-red-400 font-medium hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block px-3 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors">Log in</Link>
                    <Link
                      href="/auth/signup"
                      className="block bg-orange text-white text-center px-4 py-3 rounded-xl font-black hover:bg-orange/90 transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main>
      {/* Hero Section - AI Agent Demo */}
      <section className="min-h-screen pt-24 pb-20 relative z-10 flex items-center">
        <AgentDemoHero />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-900/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">A Clear Job. Trusted Knowledge. Your Rules.</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Everything you need to build a useful agent that stays focused on the purpose you configured.</p>
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
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#f46530] transition-colors">
                  <Link href={feature.href}>{feature.title}</Link>
                </h3>
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
            <p className="text-xl text-gray-400">Three steps from an idea to a focused, shareable Qlynk Agent</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent z-0"></div>

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
            What Should Your Agent Help People With?
          </motion.h2>
          <motion.p
            className="text-xl text-[#ffecd9] mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Create a focused AI guide for your expertise, business, property, operations, product, support workflow, or custom use case.
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
              Create Your Qlynk Agent
              <ArrowRight size={24} />
            </Link>
          </motion.div>

          <p className="text-[#ffecd9]/80 text-sm mt-8">
            14-day free trial | No charge today | 5 minute setup
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <Footer />

      <ScrollToTop />
    </div>
  );
}
