'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Zap, Crown, ArrowRight, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getCurrentProfile, signOut } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';

// Glowing Orb component matching home page
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

const faqs = [
  {
    category: 'About Qlynk Agent',
    items: [
      {
        q: 'What exactly is a Qlynk Agent?',
        a: 'A Qlynk Agent is a focused AI guide published at qlynk.site/yourname. It answers repeated questions about a person, business, property, operation, product, support workflow, or custom purpose using the knowledge and rules its owner provides.',
      },
      {
        q: 'How does the agent know what to answer?',
        a: 'You configure its purpose, audience, allowed and blocked topics, behavior, uncertainty response, and escalation path. You can then add profile context, capabilities, facts, FAQs, links, custom knowledge, and supported documents from the dashboard.',
      },
      {
        q: 'What kind of questions can visitors ask my Qlynk Agent?',
        a: 'Visitors can ask questions reasonably connected to the purpose and topics you configured. The agent answers from approved knowledge, declines out-of-scope or blocked requests, and can direct uncertain or sensitive issues to a human.',
      },
      {
        q: 'Can I customize how my Qlynk Agent looks and sounds?',
        a: 'Yes. Every plan includes agent type, purpose, audience, response rules, name, avatar, welcome message, tone, response length, and visual colors. Agency removes the visible “Powered by Qlynk” label, and the 14-day trial includes that Agency feature too.',
      },
      {
        q: 'What does my public page look like?',
        a: 'Your public qlynk.site/username page presents the agent as a focused chat experience with the identity, introduction, knowledge, and visual style you configured.',
      },
      {
        q: 'Is my Qlynk Agent available all the time?',
        a: 'During your active trial or paid subscription, visitors can use the published agent whenever the service is available. If your trial expires without an upgrade, the agent goes offline until you subscribe.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'Do I need a credit card for the free trial?',
        a: "No. The 14-day free trial includes everything in the Agency plan, including the 10,000-message allowance and removal of the visible “Powered by Qlynk” label. No credit card is required.",
      },
      {
        q: 'What happens when my trial expires?',
        a: 'At the end of 14 days, your agent goes offline unless you choose a paid plan. If you pause instead, your account data remains available so you can return and upgrade later.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Cancel from your account settings at any time with no questions asked and no hidden fees. Your agent stays live until the end of your current billing period.',
      },
      {
        q: 'What if I exceed my monthly message limit?',
        a: "You will receive an in-dashboard notification when you reach 80% of your limit. Once the limit is hit, the chat widget stays visible but shows a polite message that the agent is temporarily at capacity. Upgrading your plan restores full access immediately.",
      },
    ],
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-3">
      {faqs.map((section, si) => (
        <div key={si}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#f46530] mb-3 pl-1">
            {section.category}
          </p>
          <div className="space-y-3 mb-8">
            {section.items.map((faq, ii) => {
              const key = `${si}-${ii}`;
              const isOpen = openIndex === key;
              return (
                <motion.div
                  key={key}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: si * 0.05 + ii * 0.04 }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-5 text-left group"
                  >
                    <span className="text-base font-semibold text-white group-hover:text-[#f46530] transition-colors pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#f46530]' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="px-5 pb-5 text-gray-400 leading-relaxed border-t border-gray-700/50 pt-4">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getCurrentProfile();
        setProfile(userProfile);
      }
    };
    checkUser();
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

  const priceIds = {
    monthly: {
      creator: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY || '',
      agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY || '',
    },
    annual: {
      creator: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL || '',
      agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL || '',
    }
  };

  const handleCheckout = async (plan) => {
    if (plan.name === 'Trial') {
      router.push('/auth/signup');
      return;
    }

    if (!user) {
      router.push(`/auth/signup?plan=${plan.name.toLowerCase()}&cycle=${billingCycle}`);
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const priceId = priceIds[billingCycle][plan.name.toLowerCase()];

      if (!priceId) {
        throw new Error('Stripe price IDs are not configured for this environment.');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName: plan.name,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // If not logged in, redirect to signup
        window.location.href = `/auth/signup?plan=${plan.name.toLowerCase()}&cycle=${billingCycle}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Trial',
      description: 'Everything in Agency for 14 days',
      price: 'Free',
      period: 'for 14 days',
      cta: 'Start Free',
      icon: Zap,
      color: 'from-[#f46530] to-[#c14f22]',
      features: [
        { name: 'All Agency features', included: true },
        { name: '10,000 messages during the trial', included: true },
        { name: 'Knowledge, documents, links & FAQs', included: true },
        { name: 'Conversations, analytics & knowledge gaps', included: true },
        { name: 'Website embed, access controls & customization', included: true },
        { name: '“Powered by Qlynk” label removed', included: true },
        { name: 'No credit card required', included: true },
      ],
      highlight: true,
      badge: 'Full Agency Access',
    },
    {
      name: 'Creator',
      description: 'For one professional or focused use case',
      price: billingCycle === 'monthly' ? '$9' : '$84',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      cta: 'Choose Plan',
      icon: Crown,
      color: 'from-emerald-500 to-emerald-600',
      features: [
        { name: 'Published agent access', included: true },
        { name: '5,000 messages/month', included: true },
        { name: 'One Qlynk Agent', included: true },
        { name: 'Knowledge, documents, links & FAQs', included: true },
        { name: 'Conversation history, analytics & knowledge gaps', included: true },
        { name: 'Website embed & visitor access controls', included: true },
        { name: 'Custom identity, colors & avatar', included: true },
        { name: '“Powered by Qlynk” label remains', included: true },
      ],
    },
    {
      name: 'Agency',
      description: 'For higher-volume professional use',
      price: billingCycle === 'monthly' ? '$19' : '$180',
      period: billingCycle === 'monthly' ? '/month' : '/year (Save 21%)',
      cta: 'Upgrade Now',
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        { name: 'Everything in Creator', included: true },
        { name: '10,000 messages/month', included: true },
        { name: '“Powered by Qlynk” label removed', included: true },
        { name: 'Knowledge, documents, links & FAQs', included: true },
        { name: 'Conversation history, analytics & knowledge gaps', included: true },
        { name: 'Website embed & visitor access controls', included: true },
        { name: 'Custom identity, colors & avatar', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background effects matching home page */}
      <QlynkBackground />

      {/* Animated Floating Orbs */}
      <GlowingOrb top="10%" left="5%" size={400} color="orange" delay={0} />
      <GlowingOrb top="60%" left="80%" size={500} color="teal" delay={1} />
      <GlowingOrb top="80%" left="20%" size={300} color="orange" delay={2} />

      {/* Navigation - matching home page */}
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
              <Link href="/pricing" className="text-[#f46530] font-medium transition-colors">Pricing</Link>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-700 hover:border-[#f46530]/40 bg-gray-800/60 hover:bg-gray-800 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f46530] to-[#c14f22] flex items-center justify-center text-white text-xs font-black shadow-md shadow-[#f46530]/20">
                      {(profile?.username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-white">{profile?.username || 'there'}</span>
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
                          <p className="text-sm text-white font-semibold mt-0.5 truncate">{profile?.username || user?.email}</p>
                        </div>
                        <div className="py-1.5">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#f46530]/10 transition-all group"
                          >
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#f46530] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
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
                  <Link href="/auth/login" className="text-gray-300 hover:text-[#f46530] font-medium transition-colors">Log in</Link>
                  <motion.a
                    href="/auth/signup"
                    className="bg-[#f46530] hover:bg-[#c14f22] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:shadow-md transition-all"
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
                <Link href="/pricing" className="block px-3 py-2 text-[#f46530] font-medium rounded-lg">Pricing</Link>
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-700/40 border border-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f46530] to-[#c14f22] flex items-center justify-center text-white text-sm font-black shadow-md">
                        {(profile?.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 leading-none">Signed in as</p>
                        <p className="text-sm text-white font-semibold mt-0.5">{profile?.username || 'there'}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-[#f46530] text-white text-center px-4 py-3 rounded-xl font-black hover:bg-[#c14f22] transition-colors">
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
                      className="block bg-[#f46530] text-white text-center px-4 py-2.5 rounded-lg font-medium mt-1 hover:bg-[#c14f22] transition-colors"
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

      {/* Content */}
      <div className="relative z-10 pt-24">
        {/* Header */}
        <motion.div
          className="pt-16 pb-12 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Try every Agency feature <span className="text-[#f46530]">free for 14 days</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your trial includes everything in Agency. After 14 days, choose Creator or Agency to keep the agent live.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${billingCycle === 'monthly'
                ? 'bg-[#f46530] text-white'
                : 'text-gray-400 hover:text-gray-300'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${billingCycle === 'annual'
                ? 'bg-[#f46530] text-white'
                : 'text-gray-400 hover:text-gray-300'
                }`}
            >
              Annual (Save 21%)
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 mb-24">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className={`relative rounded-2xl backdrop-blur-sm transition-all duration-300 ${plan.highlight
                    ? 'md:scale-105 border-2 border-[#f46530]/50 bg-gradient-to-br from-[#f46530]/10 to-[#c14f22]/10'
                    : 'border border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                >
                  {/* Badge */}
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#f46530] text-white px-4 py-1 rounded-full text-sm font-bold">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="text-4xl font-black text-white">
                        {plan.price}
                        <span className="text-lg text-gray-400 font-normal"> {plan.period}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan !== null}
                      className={`w-full block text-center py-3 rounded-lg font-bold transition-all mb-8 flex items-center justify-center gap-2 ${plan.highlight
                        ? 'bg-[#f46530] hover:bg-[#c14f22] text-white shadow-lg shadow-[#f46530]/30 hover:shadow-[#f46530]/50'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                        } disabled:opacity-50`}
                    >
                      {loadingPlan === plan.name ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        plan.cta
                      )}
                    </button>

                    {/* Features */}
                    <div className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-[#2AB59E] flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <motion.div
          className="max-w-3xl mx-auto px-4 mb-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-3xl font-black text-white mb-4 text-center">
            Frequently Asked <span className="text-[#f46530]">Questions</span>
          </h2>
          <p className="text-gray-400 text-center mb-12">What happens during the trial, after the trial, and when usage limits are reached.</p>
          <FAQAccordion />
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center pb-20 px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-gray-400 mb-6">Ready to build your Qlynk Agent?</p>
          <motion.a
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#f46530] hover:bg-[#c14f22] text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-[#f46530]/30 hover:shadow-[#f46530]/50 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Free
            <ArrowRight size={20} aria-hidden="true" />
          </motion.a>
        </motion.div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
