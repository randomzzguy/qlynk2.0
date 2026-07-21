'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  ChevronUp,
  CircleHelp,
  Code2,
  FileText,
  Link2,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';
import HomepageAgentDemo from '@/components/HomepageAgentDemo';
import JsonLd from '@/components/JsonLd';
import { getCurrentUser, getCurrentProfile, signOut } from '@/lib/supabase';

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
  return (
    <div className="w-full py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-5xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange/30 bg-orange/10 backdrop-blur-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShieldCheck size={17} className="text-orange" aria-hidden="true" />
            <span className="text-sm font-bold text-[#ff8a5b]">No-code AI agent builder</span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Reclaim Your Time with an{' '}
            <span className="bg-gradient-to-r from-orange via-[#f46530] to-[#c14f22] bg-clip-text text-transparent">on demand AI Agent</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Train a reliable AI agent on your business knowledge in minutes. Deliver instant, accurate responses to client and team inquiries around the clock — so you never miss an opportunity.
            <span className="mt-3 block">See exactly what people are asking, so you always know what to add next.</span>
          </motion.p>

          <motion.div
            className="pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-8 py-4 text-lg font-black text-white shadow-lg shadow-orange/25 transition-colors hover:bg-[#c14f22]">
              Start Free <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-300">14-day free trial · Every feature included · No payment today</p>
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto mt-14 max-w-5xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <div className="absolute inset-0 bg-orange/10 blur-[120px] rounded-full pointer-events-none" />
          <p className="relative z-10 mb-5 text-center text-sm font-medium text-gray-400">Try the live Qlynk demo with a fictional business ↓</p>
          <div className="relative z-10"><HomepageAgentDemo /></div>
        </motion.div>
      </div>
    </div>
  );
};

const productFacts = [
  ['14-day free trial', 'Every feature included'],
  ['No payment today', 'Try the complete product first'],
  ['One link or embed', 'Share it wherever people need answers'],
  ['Human handoff', 'Choose when a person should step in'],
];

const whyQlynk = [
  { icon: Code2, title: 'Launch Without Coding', desc: 'Build and update your agent from one straightforward dashboard.' },
  { icon: ShieldCheck, title: 'Stay in Complete Control', desc: 'Choose the approved knowledge, set the limits, and change answers whenever needed.' },
  { icon: Link2, title: 'Share With One Simple Link', desc: 'Use a hosted Qlynk page or embed the agent on your existing website.' },
];

const homepageFaqs = [
  ['Can a Qlynk agent hallucinate?', 'Generative AI can make mistakes. Qlynk helps reduce unsupported answers by using the knowledge you provide, a defined purpose, topic limits, uncertainty instructions, and human handoff. Important answers should still be tested and reviewed.'],
  ['What files can I upload?', 'Qlynk supports PDF, DOCX, and TXT files. You can also add FAQs, facts, links, notes, profile details, and other structured knowledge from the dashboard.'],
  ['Can I update my AI later?', 'Yes. Add, edit, or remove knowledge whenever your information changes. You do not need to retrain the underlying model.'],
  ['Does it work on my website?', 'Yes. Share the hosted qlynk.site link or embed the Qlynk agent on an existing website.'],
  ['Is there a free plan?', 'Qlynk offers a 14-day free trial with every feature included and no payment today. After the trial, choose the paid plan that fits your needs.'],
];

const ProofStrip = () => (
  <section aria-label="Qlynk trial and product facts" className="relative z-10 border-y border-white/5 bg-gray-900/60">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:px-6 lg:grid-cols-4 lg:px-8">
      {productFacts.map(([title, description]) => (
        <div key={title} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-4 text-center sm:px-5">
          <p className="font-black text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      ))}
    </div>
  </section>
);

const WhyQlynk = () => (
  <section className="relative z-10 py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-3 text-sm font-bold text-[#ff8a5b]">WHY QLYNK?</p>
        <h2 className="text-4xl font-black text-white md:text-5xl">A useful agent without the complicated setup</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {whyQlynk.map((item, index) => (
          <motion.article
            key={item.title}
            className="rounded-3xl border border-gray-700 bg-gray-800/45 p-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10 text-orange"><item.icon size={24} aria-hidden="true" /></div>
            <h3 className="mt-6 text-2xl font-black text-white">{item.title}</h3>
            <p className="mt-3 leading-relaxed text-gray-400">{item.desc}</p>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

const ProductPreview = ({ type }) => {
  if (type === 'upload') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <FileText size={20} className="text-orange" aria-hidden="true" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">company-faq.pdf</p><p className="text-xs text-green-400">Ready to use</p></div>
        </div>
        <div className="rounded-xl border border-dashed border-orange/35 bg-orange/5 p-4 text-center text-sm text-gray-300"><Upload size={19} className="mx-auto mb-2 text-orange" aria-hidden="true" />Add another document or link</div>
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="space-y-3 text-sm">
        <div className="ml-10 rounded-2xl rounded-tr-sm bg-white/10 px-4 py-3 text-gray-200">What is included in your launch package?</div>
        <div className="mr-5 rounded-2xl rounded-tl-sm border border-orange/20 bg-orange/10 px-4 py-3 text-gray-200">It includes strategy, messaging, and a launch plan. Would you like the timeline too?</div>
      </div>
    );
  }

  if (type === 'edit') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-gray-500">QUESTION</p><p className="mt-1 font-bold text-white">Do you deliver internationally?</p></div><Pencil size={18} className="shrink-0 text-orange" aria-hidden="true" /></div>
        <div className="mt-4 border-t border-white/10 pt-4"><p className="text-xs font-bold text-gray-500">APPROVED ANSWER</p><p className="mt-1 text-sm text-gray-300">Yes. Delivery times depend on the destination.</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[['Popular questions', 'w-4/5'], ['Answered conversations', 'w-3/5'], ['Knowledge gaps', 'w-2/5']].map(([label, width]) => (
        <div key={label}><div className="mb-2 flex justify-between text-xs text-gray-400"><span>{label}</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full bg-orange ${width}`} /></div></div>
      ))}
    </div>
  );
};

const ProductShowcase = () => {
  const previews = [
    { type: 'upload', icon: Upload, title: 'Train With Existing Content', desc: 'Add the FAQs, documents, links, and facts you already use.' },
    { type: 'chat', icon: MessageSquare, title: 'Answer Questions Automatically', desc: 'Give people a conversational first answer from your knowledge.' },
    { type: 'edit', icon: Pencil, title: 'Keep Every Answer Current', desc: 'Update knowledge from the dashboard whenever something changes.' },
    { type: 'analytics', icon: BarChart3, title: 'See What People Still Need', desc: 'Review common questions and knowledge gaps to improve the agent.' },
  ];

  return (
    <section className="relative z-10 bg-gray-900/55 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-bold text-[#ff8a5b]">SEE QLYNK IN ACTION</p>
          <h2 className="text-4xl font-black text-white md:text-5xl">Everything you need to launch and improve your agent</h2>
          <p className="mt-4 text-sm text-gray-500 md:hidden">Swipe to explore the product workflow →</p>
        </div>
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
          {previews.map((preview, index) => (
            <motion.article key={preview.title} className="grid min-w-[86%] snap-start gap-6 rounded-3xl border border-gray-700 bg-gray-800/45 p-7 sm:min-w-[68%] md:min-w-0 md:grid-cols-[0.85fr_1.15fr] md:items-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
              <div><preview.icon size={23} className="text-orange" aria-hidden="true" /><h3 className="mt-4 text-xl font-black text-white">{preview.title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-400">{preview.desc}</p></div>
              <div className="rounded-2xl border border-white/5 bg-[#0c0c12] p-4"><ProductPreview type={preview.type} /></div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomepageFAQ = () => (
  <section className="relative z-10 py-20">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <CircleHelp size={30} className="mx-auto text-orange" aria-hidden="true" />
        <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">Common questions</h2>
      </div>
      <div className="space-y-4">
        {homepageFaqs.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-gray-700 bg-gray-800/45 open:border-orange/30">
            <summary className="flex min-h-14 w-full cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 font-bold text-white marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff8a5b]">{question}<span className="text-2xl font-light text-[#ff8a5b] transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary>
            <p className="px-6 pb-6 leading-relaxed text-gray-400">{answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-7 text-center text-gray-400">More questions? <Link href="/faq" className="font-bold text-[#ff8a5b] hover:underline">Read the full FAQ</Link>.</p>
    </div>
  </section>
);

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

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden"
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: homepageFaqs.map(([question, answer]) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
        }}
      />
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
                    Start Free
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
                      Start Free
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main>
        <section className="relative z-10 pt-24 pb-10">
          <AgentDemoHero />
        </section>

        <ProofStrip />
        <WhyQlynk />
        <ProductShowcase />
        <HomepageFAQ />

        <section className="relative z-10 bg-gradient-to-r from-[#f46530] to-[#c14f22] py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2 className="text-4xl font-black text-white md:text-5xl" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Ready to stop answering the same questions?
            </motion.h2>
            <motion.p className="mx-auto mt-5 max-w-2xl text-xl text-[#ffecd9]" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
              Build your AI agent free for 14 days using the knowledge you already have.
            </motion.p>
            <motion.div className="mt-9" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-5 text-xl font-black text-[#9a3412] shadow-lg transition-colors hover:bg-gray-100 hover:text-[#7c2d12]">
                Start Free <ArrowRight size={23} aria-hidden="true" />
              </Link>
            </motion.div>
            <p className="mt-7 text-[15px] leading-relaxed text-white">14-day free trial · Every feature included · No payment today</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      <ScrollToTop />
    </div>
  );
}
