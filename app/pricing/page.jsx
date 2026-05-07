'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Zap, Crown, ArrowRight, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';

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
    category: 'About Q-Agent',
    items: [
      {
        q: 'What exactly is a Q-Agent?',
        a: 'A Q-Agent is an AI-powered version of you that lives on your personal page at qlynk.site/yourname. It answers questions about you, your work, your skills, and your projects — 24/7, without you lifting a finger. Think of it as a digital clone that represents you online.',
      },
      {
        q: 'How does the AI know things about me?',
        a: 'You train your Q-Agent through your dashboard. You fill in structured forms covering your bio, skills, projects, social links, and contact info. You can also upload documents like a resume, portfolio PDF, or any text file, and the agent learns from those too.',
      },
      {
        q: 'What kind of questions can visitors ask my Q-Agent?',
        a: 'Visitors can ask anything about you — your background, what services you offer, how to contact you, what projects you\'ve worked on, your pricing, your availability, and much more. The agent answers conversationally based on the knowledge you\'ve provided.',
      },
      {
        q: 'Can I customize how my Q-Agent looks and sounds?',
        a: 'Yes. You can set your agent\'s name, profile avatar, welcome message, and primary brand color. On the Agency tier you can fully white-label the agent, removing all Qlynk branding entirely.',
      },
      {
        q: 'What does my public page look like?',
        a: 'Your public page at qlynk.site/username displays your profile using a theme you choose from the dashboard. The Q-Agent chat widget sits as a floating bubble in the corner, ready for visitors to interact with at any time.',
      },
      {
        q: 'Is my Q-Agent available all the time?',
        a: 'During your trial and on any paid plan, yes — your agent runs 24/7. If your trial expires and you have not upgraded, your agent goes offline and visitors will see a "temporarily unavailable" message until you resubscribe.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'Do I need a credit card for the free trial?',
        a: "Yes, a valid credit card is required to start the trial. We won't charge you anything during the 14-day period. After the trial ends your card is charged for the Creator plan unless you cancel first.",
      },
      {
        q: 'What happens when my trial expires?',
        a: 'Your agent goes offline and visitors see a "temporarily unavailable" message. Your dashboard stays fully accessible so you can keep editing. Upgrade at any time to bring your agent back online instantly.',
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

  const allItems = faqs.flatMap((section, si) =>
    section.items.map((item, ii) => ({ ...item, key: `${si}-${ii}`, category: section.category }))
  );

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
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const priceIds = {
    monthly: {
      trial: 'price_creator_monthly', // Map trial to creator monthly
      creator: 'price_1TUVu9DMxhyZS2wA05Hr9eZF',
      agency: 'price_1TUX2FDMxhyZS2wA9weEnXSH',
    },
    annual: {
      trial: 'price_creator_annual',
      creator: 'price_1TUVvSDMxhyZS2wA5QH7RGUM',
      agency: 'price_1TUWzcDMxhyZS2wA0VQr5bzq',
    }
  };

  const handleCheckout = async (plan) => {
    if (!user) {
      router.push(`/auth/signup?plan=${plan.name.toLowerCase()}&cycle=${billingCycle}`);
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const priceId = priceIds[billingCycle][plan.name.toLowerCase()];

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
      description: '14 days to test everything',
      price: 'Free',
      period: 'for 14 days',
      cta: 'Start Free Trial',
      icon: Zap,
      color: 'from-[#f46530] to-[#c14f22]',
      features: [
        { name: 'Full Pro features', included: true },
        { name: 'Agent live for trial period', included: true },
        { name: 'Credit card required', included: true },
        { name: 'Auto-upgrade after trial', included: true },
      ],
      highlight: true,
    },
    {
      name: 'Creator',
      description: 'For content creators & professionals',
      price: billingCycle === 'monthly' ? '$9' : '$84',
      period: billingCycle === 'monthly' ? '/month' : '/year (Save 22%)',
      cta: 'Upgrade Now',
      icon: Crown,
      color: 'from-emerald-500 to-emerald-600',
      features: [
        { name: 'Agent live 24/7', included: true },
        { name: '2,000 messages/month', included: true },
        { name: 'Unlimited conversations', included: true },
        { name: 'Forms + 5 documents', included: true },
        { name: 'Custom colors & avatar', included: true },
        { name: 'Full analytics', included: true },
        { name: 'Email support', included: true },
      ],
    },
    {
      name: 'Agency',
      description: 'For agencies & businesses',
      price: billingCycle === 'monthly' ? '$19' : '$180',
      period: billingCycle === 'monthly' ? '/month' : '/year (Save 21%)',
      cta: 'Upgrade Now',
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        { name: 'Agent live 24/7', included: true },
        { name: '10,000 messages/month', included: true },
        { name: 'Unlimited conversations', included: true },
        { name: 'Forms + 25 documents', included: true },
        { name: 'Full white-label', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Up to 3 agents', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom domain', included: true },
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
                  alt="qlynk logo"
                  width={125}
                  height={50}
                  priority
                  className="group-hover:scale-105 transition-transform"
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/pricing" className="text-[#f46530] font-medium transition-colors">Pricing</Link>
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
                <Link href="/pricing" className="block px-3 py-2 text-[#f46530]">Pricing</Link>
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
            Simple, <span className="text-[#f46530]">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start with a free 14-day trial. Credit card required. Upgrade anytime to go live.
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
                        Most Popular
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
          <p className="text-gray-400 text-center mb-12">Everything you need to know about Q-Agent</p>
          <FAQAccordion />
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center pb-20 px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-gray-400 mb-6">Ready to build your Q-Agent?</p>
          <motion.a
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#f46530] hover:bg-[#c14f22] text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-[#f46530]/30 hover:shadow-[#f46530]/50 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Your Free Trial
            <ArrowRight size={20} />
          </motion.a>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-gray-700 bg-gray-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-400">© 2026 qlynk. Your AI clone, in a blink.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
