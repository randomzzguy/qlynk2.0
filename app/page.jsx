'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Brain,
  Building2,
  ChevronUp,
  CircleHelp,
  Eye,
  Headphones,
  Link2,
  MapPinHouse,
  PlayCircle,
  RefreshCw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';
import HomepageAgentDemo from '@/components/HomepageAgentDemo';
import JsonLd from '@/components/JsonLd';
import { trackMarketingEvent } from '@/lib/marketing-events';
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
            <span className="text-sm font-bold text-orange">
              A trusted AI agent for the information you choose
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Answer Routine Questions Instantly—
            <span className="block bg-gradient-to-r from-orange via-[#f46530] to-[#c14f22] bg-clip-text text-transparent">With Information You Control</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Qlynk turns your FAQs, documents, links, and business information into a shareable AI agent for customers, clients, guests, or employees. Set the limits, publish one link, and update the answer whenever it changes.
          </motion.p>

          <motion.p
            className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-relaxed text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span className="font-bold text-white">What is “approved knowledge”?</span>{' '}
            It is simply the information you have reviewed and chosen for your agent to use.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link
              href="/auth/signup"
              data-analytics-event="homepage_signup_click"
              data-analytics-placement="hero"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange px-8 py-4 text-lg font-black text-white shadow-lg shadow-orange/20 transition-colors hover:bg-[#c14f22]"
            >
              Build My AI Agent <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <a
              href="#live-demo"
              data-analytics-event="homepage_demo_click"
              data-analytics-placement="hero"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-bold text-white transition-colors hover:border-orange/50 hover:bg-orange/10"
            >
              <PlayCircle size={20} aria-hidden="true" /> Try the Live Demo
            </a>
          </motion.div>

          <motion.p
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.75 }}
          >
            14-day free trial with every Agency feature · No payment today
          </motion.p>
        </div>

        <div id="live-demo" className="relative mx-auto mt-14 max-w-5xl scroll-mt-28">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] w-[100%] bg-orange/5 blur-[120px] rounded-full pointer-events-none z-0" />
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <div className="mb-5 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> Live and interactive
              </span>
              <p className="text-sm text-gray-400">Ask the fictional Northstar Studio agent a real customer question.</p>
            </div>
            <HomepageAgentDemo />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const proofPoints = [
  { icon: ShieldCheck, title: 'Full Agency trial', desc: 'Every Agency feature for 14 days' },
  { icon: SlidersHorizontal, title: 'No code required', desc: 'Build and maintain it from your dashboard' },
  { icon: Link2, title: 'One simple link', desc: 'Use a hosted page or embed it on your website' },
  { icon: Headphones, title: 'Human handoff', desc: 'Choose what happens when a person should step in' },
];

const outcomes = [
  {
    icon: Building2,
    audience: 'For businesses',
    title: 'Give customers a useful first answer',
    desc: 'Explain services, availability, policies, and next steps without making every visitor wait for a person.',
    href: '/solutions/business-ai-assistant',
  },
  {
    icon: Users,
    audience: 'For experts and teams',
    title: 'Protect time for work that needs your judgment',
    desc: 'Make repeated explanations available while you focus on clients, decisions, and higher-value work.',
    href: '/solutions/ai-for-consultants',
  },
  {
    icon: MapPinHouse,
    audience: 'For properties and places',
    title: 'Help guests know what to do next',
    desc: 'Share practical guidance, policies, directions, and contacts through one conversational link.',
    href: '/solutions/ai-property-assistant',
  },
];

const workflowSteps = [
  {
    num: '01',
    icon: Upload,
    title: 'Add the information you trust',
    desc: 'Bring together reviewed FAQs, facts, links, notes, profile details, and supported documents.',
  },
  {
    num: '02',
    icon: SlidersHorizontal,
    title: 'Set the job and the limits',
    desc: 'Define the audience, allowed topics, tone, uncertainty response, and human handoff.',
  },
  {
    num: '03',
    icon: Share2,
    title: 'Share, review, and improve',
    desc: 'Publish one link or website embed, then use real questions and knowledge gaps to keep answers useful.',
  },
];

const trustControls = [
  { icon: Brain, title: 'You choose the sources', desc: 'The agent is built around information you intentionally add and maintain.' },
  { icon: ShieldCheck, title: 'You define the boundaries', desc: 'Set its purpose, audience, allowed topics, blocked topics, and behavior.' },
  { icon: Headphones, title: 'People remain the authority', desc: 'Configure what the agent should say when it is uncertain and where to send someone for help.' },
  { icon: RefreshCw, title: 'Answers can stay current', desc: 'Edit or remove knowledge when a policy, offering, or instruction changes—without retraining a model.' },
];

const homepageFaqs = [
  ['What exactly is Qlynk?', 'Qlynk is a no-code platform that turns information you choose to share into a focused AI agent. People can ask it questions through a Qlynk link or an agent embedded on your website.'],
  ['What does “approved knowledge” mean?', 'It means the facts, FAQs, links, notes, profile details, and supported documents you have reviewed and chosen for the agent to use.'],
  ['Can a Qlynk agent give an incorrect answer?', 'Generative AI can still make mistakes. Qlynk helps reduce unsupported answers by giving the agent a defined job, selected knowledge, topic boundaries, uncertainty instructions, and a human handoff. Important answers should still be reviewed and tested.'],
  ['Can I control what the agent discusses?', 'Yes. You can configure its purpose, audience, allowed and blocked topics, do and don’t rules, response style, uncertainty behavior, and escalation message.'],
  ['Can I update the knowledge later?', 'Yes. You can add, edit, or remove knowledge from the dashboard whenever your information changes. You do not need to retrain a model.'],
  ['Can I use it on my website?', 'Yes. You can share the hosted Qlynk agent link or embed the agent on an existing website.'],
];

const ProductProof = () => (
  <section aria-labelledby="product-proof-title" className="relative z-10 border-y border-white/5 bg-gray-900/60">
    <h2 id="product-proof-title" className="sr-only">Qlynk product facts</h2>
    <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/5 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
      {proofPoints.map((point) => (
        <div key={point.title} className="flex items-start gap-4 px-4 py-7 sm:px-6">
          <point.icon size={22} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
          <div>
            <p className="font-bold text-white">{point.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{point.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const OutcomeSection = () => (
  <section className="relative z-10 py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <p className="mb-4 text-sm font-bold text-orange">MAKE KNOWLEDGE AVAILABLE WHEN IT IS NEEDED</p>
        <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">Spend less time repeating answers. Keep more time for the work that needs you.</h2>
        <p className="mt-6 text-xl leading-relaxed text-gray-400">Qlynk gives people a clear place to ask routine questions while you decide what the agent knows, where its role ends, and when a person takes over.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {outcomes.map((outcome, index) => (
          <motion.article
            key={outcome.title}
            className="group rounded-3xl border border-gray-700 bg-gray-800/40 p-8 transition-colors hover:border-orange/40"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10 text-orange transition-colors group-hover:bg-orange group-hover:text-white">
              <outcome.icon size={27} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-orange">{outcome.audience}</p>
            <h3 className="mt-3 text-2xl font-black text-white">{outcome.title}</h3>
            <p className="mt-4 leading-relaxed text-gray-400">{outcome.desc}</p>
            <Link href={outcome.href} className="mt-7 inline-flex items-center gap-2 font-bold text-white transition-colors hover:text-orange">
              Explore this solution <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

const WorkflowPreview = ({ index }) => {
  if (index === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c0c12] p-4 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <span className="text-xs font-bold text-gray-500">QUESTION</span>
          <p className="mt-1 text-white">Do you deliver internationally?</p>
        </div>
        <div className="rounded-xl border border-orange/20 bg-orange/10 p-3">
          <span className="text-xs font-bold text-orange">APPROVED ANSWER</span>
          <p className="mt-1 text-gray-300">Add the current policy your team has reviewed.</p>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0c0c12] p-4 text-sm">
        <div>
          <span className="text-xs font-bold text-gray-500">ALLOWED TOPICS</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Services', 'Pricing', 'Delivery'].map((topic) => <span key={topic} className="rounded-full bg-green-500/10 px-3 py-1 text-green-300">{topic}</span>)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-gray-300">
          If unsure, offer the support contact instead of guessing.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c0c12] p-4 text-sm">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-gray-300">
        <Link2 size={16} className="text-orange" aria-hidden="true" /> qlynk.site/yourname
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-orange/20 bg-orange/10 p-3">
        <Eye size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
        <p className="text-gray-300"><span className="font-bold text-white">Knowledge gap:</span> visitors asked about weekend support.</p>
      </div>
    </div>
  );
};

const WorkflowSection = () => (
  <section id="how-it-works" className="relative z-10 bg-gray-900/55 py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-14 max-w-3xl">
        <p className="mb-4 text-sm font-bold text-orange">A LOOK AT THE WORKFLOW</p>
        <h2 className="text-4xl font-black text-white md:text-5xl">From a repeated question to a useful agent in three steps</h2>
        <p className="mt-6 text-xl leading-relaxed text-gray-400">Start with a focused job. Add only the information that supports it. Then learn from the questions people actually ask.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <motion.article
            key={step.title}
            className="overflow-hidden rounded-3xl border border-gray-700 bg-gray-800/50"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
          >
            <div className="p-7">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange text-white"><step.icon size={23} aria-hidden="true" /></div>
                <span className="text-3xl font-black text-white/10">{step.num}</span>
              </div>
              <h3 className="text-2xl font-black text-white">{step.title}</h3>
              <p className="mt-3 min-h-[72px] leading-relaxed text-gray-400">{step.desc}</p>
            </div>
            <div className="border-t border-white/5 bg-black/15 p-5"><WorkflowPreview index={index} /></div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

const TrustSection = () => (
  <section className="relative z-10 py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-start gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28">
          <p className="mb-4 text-sm font-bold text-orange">TRUST IS A WORKFLOW</p>
          <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">Designed for answers you can stand behind</h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">Qlynk does not make generative AI infallible. It gives you practical controls for reducing unsupported answers, defining uncertainty, and keeping people responsible for important decisions.</p>
          <Link href="/features/security" className="mt-8 inline-flex items-center gap-2 font-bold text-orange hover:underline">
            Explore scope and controls <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {trustControls.map((control, index) => (
            <motion.article
              key={control.title}
              className="rounded-3xl border border-gray-700 bg-gray-800/40 p-7"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <control.icon size={25} className="text-orange" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-black text-white">{control.title}</h3>
              <p className="mt-3 leading-relaxed text-gray-400">{control.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const ComparisonSection = () => {
  const rows = [
    ['Purpose', 'Broad, open-ended assistance', 'One defined job for a specific audience'],
    ['Knowledge', 'General context supplied in each conversation', 'Owner-selected knowledge maintained in one dashboard'],
    ['Boundaries', 'Dependent on the user’s prompt', 'Configured topics, rules, uncertainty, and handoff'],
    ['Publishing', 'A conversation for the current user', 'A branded link or website embed for your audience'],
    ['Improvement', 'Start another conversation', 'Review questions, feedback, and knowledge gaps'],
  ];

  return (
    <section className="relative z-10 bg-gray-900/55 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-4 text-sm font-bold text-orange">WHY NOT JUST USE A GENERAL AI CHAT?</p>
          <h2 className="text-4xl font-black text-white md:text-5xl">Qlynk is built to represent maintained knowledge—not answer everything</h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">A general AI chat is useful for open-ended tasks. Qlynk is for publishing a focused agent that your audience can return to.</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-700 bg-gray-800/40">
          <div className="hidden grid-cols-[0.7fr_1fr_1fr] border-b border-gray-700 bg-black/20 px-6 py-4 text-sm font-bold sm:grid">
            <span className="text-gray-500">COMPARE</span>
            <span className="text-gray-300">General AI chat</span>
            <span className="text-orange">Qlynk agent</span>
          </div>
          {rows.map(([label, general, qlynk]) => (
            <div key={label} className="grid gap-4 border-b border-gray-700 px-6 py-6 last:border-b-0 sm:grid-cols-[0.7fr_1fr_1fr] sm:gap-6">
              <p className="font-black text-white">{label}</p>
              <div><span className="mb-1 block text-xs font-bold text-gray-500 sm:hidden">GENERAL AI CHAT</span><p className="text-gray-400">{general}</p></div>
              <div><span className="mb-1 block text-xs font-bold text-orange sm:hidden">QLYNK AGENT</span><p className="text-gray-200">{qlynk}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/compare" className="inline-flex items-center gap-2 font-bold text-orange hover:underline">View platform comparisons <ArrowRight size={18} aria-hidden="true" /></Link>
          <span className="hidden text-gray-700 sm:inline">•</span>
          <Link href="/docs" className="inline-flex items-center gap-2 font-bold text-white hover:text-orange">Read how Qlynk works <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
};

const HomepageFAQ = () => (
  <section className="relative z-10 py-24">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange"><CircleHelp size={25} aria-hidden="true" /></div>
        <h2 className="text-4xl font-black text-white md:text-5xl">Questions people ask before they build</h2>
        <p className="mt-5 text-xl text-gray-400">Straight answers about control, accuracy, updates, and publishing.</p>
      </div>

      <div className="space-y-4">
        {homepageFaqs.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-gray-700 bg-gray-800/40 open:border-orange/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 font-bold text-white marker:content-none">
              {question}
              <span className="text-2xl font-light text-orange transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="px-6 pb-6 leading-relaxed text-gray-400">{answer}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-center text-gray-400">Still deciding? <Link href="/faq" className="font-bold text-orange hover:underline">Read the complete FAQ</Link>.</p>
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

  useEffect(() => {
    const handleTrackedClick = (event) => {
      const target = event.target.closest?.('[data-analytics-event]');
      if (!target) return;

      trackMarketingEvent(target.dataset.analyticsEvent, {
        placement: target.dataset.analyticsPlacement || 'unknown',
      });
    };

    document.addEventListener('click', handleTrackedClick);
    return () => document.removeEventListener('click', handleTrackedClick);
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
                    data-analytics-event="homepage_signup_click"
                    data-analytics-placement="desktop_nav"
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
                      data-analytics-event="homepage_signup_click"
                      data-analytics-placement="mobile_nav"
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

        <ProductProof />
        <OutcomeSection />
        <WorkflowSection />
        <TrustSection />
        <ComparisonSection />
        <HomepageFAQ />

        <section className="relative z-10 bg-gradient-to-r from-[#f46530] to-[#c14f22] py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              className="text-4xl font-black text-white md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Make the next routine question easier to answer
            </motion.h2>
            <motion.p
              className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-[#ffecd9]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              Start with one repeated question, add the answer you trust, and define when a person should step in.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/auth/signup"
                data-analytics-event="homepage_signup_click"
                data-analytics-placement="final_cta"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-5 text-xl font-black text-[#9a3412] shadow-lg transition-colors hover:bg-gray-100 hover:text-[#7c2d12]"
              >
                Start Free <ArrowRight size={23} aria-hidden="true" />
              </Link>
              <a
                href="#live-demo"
                data-analytics-event="homepage_demo_click"
                data-analytics-placement="final_cta"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-10 py-5 text-xl font-bold text-white transition-colors hover:bg-white/20"
              >
                <PlayCircle size={22} aria-hidden="true" /> Try the Demo
              </a>
            </motion.div>

            <p className="mt-8 text-sm text-[#ffecd9]">14-day free trial with every Agency feature · No payment today</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      <ScrollToTop />
    </div>
  );
}
