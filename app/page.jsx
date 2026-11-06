'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';
import HomepageHero from '@/components/HomepageHero';
import JsonLd from '@/components/JsonLd';
import {
  ControlSection,
  FinalCTA,
  FreePlanSection,
  HomeFAQ,
  QuestionsWall,
  WhereItLives,
} from '@/components/home/HomeSections';
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

const homepageFaqs = [
  ['Can a Qlynk agent hallucinate?', 'Generative AI can make mistakes. Qlynk helps reduce unsupported answers by using the knowledge you provide, a defined purpose, topic limits, uncertainty instructions, and human handoff. Important answers should still be tested and reviewed.'],
  ['What files can I upload?', 'Qlynk supports PDF, DOCX, and TXT files. You can also add FAQs, facts, links, notes, profile details, and other structured knowledge from the dashboard.'],
  ['Can I update my AI later?', 'Yes. Add, edit, or remove knowledge whenever your information changes. You do not need to retrain the underlying model.'],
  ['Does it work on my website?', 'Yes. Share the hosted qlynk.site link or embed the Qlynk agent on an existing website.'],
  ['Can I change my public Qlynk URL?', 'Yes. Change your username from Account Settings once every 30 days. Your old URL stops working immediately, so update links and bookmarks after the change.'],
  ['Is there a free plan?', 'Yes. Creator is free with no expiry and no credit card required. Each account includes one agent and 5,000 messages per calendar month. Agency is an optional paid upgrade.'],
];

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
          // Sits directly above the Qlynk chat launcher (56px button, 16px from the bottom-right corner).
          className="fixed bottom-[84px] right-[22px] z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#151923]/90 text-white shadow-xl shadow-black/40 backdrop-blur-md transition-all hover:scale-110 hover:border-orange/50 hover:text-orange active:scale-95 group"
          aria-label="Scroll to top"
        >
          <ChevronUp size={22} className="group-hover:-translate-y-0.5 transition-transform" />
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
        <section aria-labelledby="qlynk-hero-title" className="relative z-10 pb-12 pt-28 sm:pb-16 sm:pt-32">
          <HomepageHero isSignedIn={Boolean(user)} />
        </section>

        <QuestionsWall />
        <ControlSection />
        <WhereItLives />
        <FreePlanSection />
        <HomeFAQ faqs={homepageFaqs} />
        <FinalCTA isSignedIn={Boolean(user)} />
      </main>

      {/* Footer */}
      <Footer transparent />

      <Script
        id="qlynk-homepage-widget"
        src="https://www.qlynk.site/qlynk-agent.js"
        data-widget-id="01bbaa14-aa59-462d-9693-644802bd3d7f"
        strategy="afterInteractive"
      />

      <ScrollToTop />
    </div>
  );
}
