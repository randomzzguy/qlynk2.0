'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Check,
  Code2,
  FileText,
  GraduationCap,
  Headphones,
  Link2,
  Loader2,
  Plus,
  Send,
  Trophy,
  UserPlus,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';

// Scripted, fictional examples. Each one shows the same idea: the agent
// becomes whatever knowledge it is fed, then answers from that knowledge.
const PERSONAS = [
  {
    id: 'support',
    label: 'Customer support',
    becomes: 'support team.',
    name: 'Bloom & Co. Help',
    slug: 'bloomandco',
    accent: '#EB5E28',
    icon: Headphones,
    files: [
      { name: 'Returns policy.pdf', meta: '4 pages' },
      { name: 'Shipping FAQ.docx', meta: '18 answers' },
      { name: 'bloomandco.com/sizing', meta: 'Web page', link: true },
    ],
    greeting: "Hi! I'm Bloom's assistant. Ask me anything about orders, returns or sizing.",
    questions: [
      { q: "Can I return a dress I've already worn?", a: "Worn items can't be refunded, but if there's a defect we'll replace it free within 30 days. Want me to start a replacement request?", source: 'Returns policy.pdf' },
      { q: 'How long does shipping to Canada take?', a: "Orders to Canada arrive in 5–8 business days. Shipping is free over $80, otherwise it's a flat $12.", source: 'Shipping FAQ.docx' },
      { q: "I'd like to talk to a real person", a: "Of course. I've passed this conversation to the Bloom team, and someone will reply by email within 2 hours.", handoff: true },
    ],
  },
  {
    id: 'onboarding',
    label: 'Employee onboarding',
    becomes: 'onboarding buddy.',
    name: 'Acme Onboarding Buddy',
    slug: 'acme-onboarding',
    accent: '#2AB59E',
    icon: UserPlus,
    files: [
      { name: 'Employee handbook.pdf', meta: '42 pages' },
      { name: 'IT setup guide.docx', meta: '6 pages' },
      { name: 'Benefits 2026.pdf', meta: '11 pages' },
    ],
    greeting: 'Welcome to Acme! I can help with your first weeks: policies, tools and benefits.',
    questions: [
      { q: 'How many vacation days do I get?', a: 'Full-time employees get 25 paid vacation days a year, plus public holidays. Days accrue monthly from your start date.', source: 'Employee handbook.pdf' },
      { q: 'How do I set up my work email?', a: 'Sign in at mail.acme.com with the temporary password from IT, then turn on 2-step verification under Settings → Security. It takes about 5 minutes.', source: 'IT setup guide.docx' },
      { q: 'When does my health insurance start?', a: 'Coverage starts on the first day of the month after you join. Enrolment closes 30 days after your start date.', source: 'Benefits 2026.pdf' },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    becomes: 'restaurant host.',
    name: 'Saffron Kitchen',
    slug: 'saffronkitchen',
    accent: '#F5A524',
    icon: UtensilsCrossed,
    files: [
      { name: 'Menu.pdf', meta: '3 pages' },
      { name: 'Opening hours.txt', meta: 'Notes' },
      { name: 'Allergen chart.pdf', meta: '2 pages' },
    ],
    greeting: 'Welcome to Saffron Kitchen! Ask me about the menu, opening hours or allergies.',
    questions: [
      { q: 'Do you have gluten-free options?', a: 'Yes, 9 dishes are gluten-free, including the lamb tagine and all grilled mains. Let your server know and the kitchen will use a separate prep area.', source: 'Allergen chart.pdf' },
      { q: 'Are you open on Sunday night?', a: "We're open Sundays from 12pm to 10pm. The kitchen takes last orders at 9:30pm.", source: 'Opening hours.txt' },
      { q: 'Can I book a table for 12 people?', a: "Groups over 8 are booked by our team directly. I've sent them your request, and they'll confirm by phone today.", handoff: true },
    ],
  },
  {
    id: 'freelancer',
    label: 'Freelancer portfolio',
    becomes: 'always-on portfolio.',
    name: 'Maya Chen · Product Designer',
    slug: 'mayachen',
    accent: '#A78BFA',
    icon: Briefcase,
    files: [
      { name: 'Resume.pdf', meta: '2 pages' },
      { name: 'Case studies.pdf', meta: '5 projects' },
      { name: 'Rates & process.txt', meta: 'Notes' },
    ],
    greeting: "Hi, I'm Maya's AI. Ask me about her work, experience or availability.",
    questions: [
      { q: 'Has Maya worked on fintech apps?', a: "Yes. She led the redesign of Penny's budgeting app, which lifted weekly active users by 34%. The case study walks through her research and testing.", source: 'Case studies.pdf' },
      { q: 'How much does a landing page cost?', a: 'Landing pages start at $2,400 and take about two weeks, including two rounds of revisions.', source: 'Rates & process.txt' },
      { q: 'Is she available next month?', a: "Maya has two openings next month. I've shared your interest with her, and she usually replies within a day.", handoff: true },
    ],
  },
  {
    id: 'course',
    label: 'Online course',
    becomes: 'teaching assistant.',
    name: 'Intro to Data · Course TA',
    slug: 'intro-to-data',
    accent: '#38BDF8',
    icon: GraduationCap,
    files: [
      { name: 'Syllabus.pdf', meta: '5 pages' },
      { name: 'Week 3 notes.pdf', meta: '14 pages' },
      { name: 'Grading rubric.docx', meta: '1 page' },
    ],
    greeting: "Hey! I'm the TA for Intro to Data. Ask me about lessons, deadlines or grading.",
    questions: [
      { q: 'When is project 2 due?', a: 'Project 2 is due Friday, March 14 at 11:59pm. Late submissions lose 10% per day, for up to 3 days.', source: 'Syllabus.pdf' },
      { q: "What's the difference between mean and median?", a: "The mean is the average of all values. The median is the middle value once they're sorted. The notes suggest the median when there are outliers, like house prices.", source: 'Week 3 notes.pdf' },
      { q: 'How is the final project graded?', a: "It's out of 100: analysis 40, visualisation 30, written summary 20 and code quality 10.", source: 'Grading rubric.docx' },
    ],
  },
];

const FALLBACK_ANSWER = "Good question! This is a scripted preview, so I only know the sample answers below. Your own agent answers anything covered by what you give it.";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tokenize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 3);

function matchQuestion(persona, text) {
  const words = new Set(tokenize(text));
  let best = { index: -1, score: 0 };
  persona.questions.forEach((item, index) => {
    const score = tokenize(item.q).filter((word) => words.has(word)).length;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 1 ? best.index : -1;
}

function FlowLine({ active, accent }) {
  return (
    <div className="relative hidden h-px flex-1 bg-white/10 lg:block" aria-hidden="true">
      {active && [0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="absolute -top-[3px] h-[7px] w-[7px] rounded-full"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.36, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function AgentCore({ persona, fed, ready, compact = false }) {
  const Icon = persona.icon;
  const size = compact ? 'h-20 w-20' : 'h-36 w-36';
  return (
    <div className={`relative shrink-0 ${size}`}>
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        animate={{ background: persona.accent, opacity: ready ? 0.45 : 0.18 + fed * 0.08 }}
        transition={{ duration: 0.6 }}
      />
      <div
        className="absolute inset-0 animate-spin rounded-full border border-dashed"
        style={{ borderColor: `${persona.accent}80`, animationDuration: '14s' }}
      />
      <div
        className="absolute inset-[10%] rounded-full border border-white/10"
        style={{ animation: 'spin 22s linear infinite reverse' }}
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full" style={{ background: persona.accent }} />
      </div>
      <motion.div
        key={`${persona.id}-${fed}`}
        className="absolute inset-[20%] flex items-center justify-center rounded-full border border-white/15 bg-[#10131c] shadow-inner"
        initial={{ scale: fed > 0 ? 0.86 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        style={{ boxShadow: `inset 0 0 24px ${persona.accent}33` }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={ready ? persona.id : 'blank'}
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
            transition={{ duration: 0.3 }}
            style={{ color: ready ? persona.accent : 'rgba(255,255,255,0.35)' }}
          >
            {ready ? <Icon size={compact ? 22 : 34} aria-hidden="true" /> : <Loader2 size={compact ? 20 : 28} className="animate-spin" aria-hidden="true" />}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function HomepageHero({ isSignedIn = false }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [fed, setFed] = useState(0);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [asked, setAsked] = useState([]);
  const [draft, setDraft] = useState('');
  const [userText, setUserText] = useState('');
  const [autoplay, setAutoplay] = useState(true);
  const runRef = useRef(0);
  const autoplayRef = useRef(true);
  const pendingRef = useRef(null);
  const idRef = useRef(0);
  const scrollRef = useRef(null);

  const persona = PERSONAS[active];
  const signupHref = isSignedIn ? '/dashboard' : '/auth/signup';
  const streaming = messages.some((message) => message.role === 'assistant' && !message.done);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Cancels whatever scripted step is running and completes a half-typed answer.
  const interrupt = useCallback(() => {
    runRef.current += 1;
    const pending = pendingRef.current;
    if (pending) {
      setMessages((current) => current.map((message) => (
        message.id === pending.id ? { ...message, text: pending.text, done: true } : message
      )));
      pendingRef.current = null;
    }
    setDraft('');
    return runRef.current;
  }, []);

  const stopAutoplay = useCallback(() => {
    autoplayRef.current = false;
    setAutoplay(false);
  }, []);

  // Plays one exchange: the question is typed, then the answer streams in.
  const playExchange = useCallback(async (runId, item, { questionIndex = -1, typeQuestion = true } = {}) => {
    const alive = () => runRef.current === runId;
    if (typeQuestion && !reduceMotion) {
      for (let i = 1; i <= item.q.length; i += 1) {
        if (!alive()) return false;
        setDraft(item.q.slice(0, i));
        await wait(24);
      }
      await wait(260);
    }
    if (!alive()) return false;
    setDraft('');

    idRef.current += 1;
    const userId = `u-${idRef.current}`;
    const botId = `a-${idRef.current}`;
    pendingRef.current = { id: botId, text: item.a };
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', text: item.q, done: true },
      { id: botId, role: 'assistant', text: '', done: false, source: item.source, handoff: item.handoff, cta: item.cta },
    ]);
    if (questionIndex >= 0) setAsked((current) => (current.includes(questionIndex) ? current : [...current, questionIndex]));

    await wait(reduceMotion ? 0 : 800);
    const words = item.a.split(' ');
    for (let i = 1; i <= words.length; i += 1) {
      if (!alive()) return false;
      const text = words.slice(0, i).join(' ');
      const done = i === words.length;
      setMessages((current) => current.map((message) => (message.id === botId ? { ...message, text, done } : message)));
      if (!done && !reduceMotion) await wait(38);
    }
    pendingRef.current = null;
    return true;
  }, [reduceMotion]);

  const goTo = useCallback((index, byUser = false) => {
    if (byUser) stopAutoplay();
    interrupt();
    setActive(index);
    setFed(0);
    setReady(false);
    setMessages([]);
    setAsked([]);
    setUserText('');
  }, [interrupt, stopAutoplay]);

  // Feed the knowledge in, transform the agent, then answer the first question.
  useEffect(() => {
    runRef.current += 1;
    const runId = runRef.current;
    const alive = () => runRef.current === runId;
    const current = PERSONAS[active];

    (async () => {
      await wait(reduceMotion ? 0 : 450);
      for (let i = 1; i <= current.files.length; i += 1) {
        if (!alive()) return;
        setFed(i);
        await wait(reduceMotion ? 0 : 620);
      }
      if (!alive()) return;
      setReady(true);
      setMessages([{ id: `greet-${current.id}`, role: 'assistant', text: current.greeting, done: true }]);
      await wait(reduceMotion ? 300 : 900);
      if (!alive()) return;
      const finished = await playExchange(runId, current.questions[0], { questionIndex: 0 });
      if (!finished || !autoplayRef.current) return;
      await wait(5200);
      if (alive() && autoplayRef.current) goTo((active + 1) % PERSONAS.length);
    })();

    return () => { runRef.current += 1; };
  }, [active, goTo, playExchange, reduceMotion]);

  const askQuestion = (index) => {
    stopAutoplay();
    const runId = interrupt();
    playExchange(runId, persona.questions[index], { questionIndex: index, typeQuestion: false });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = userText.trim();
    if (!text || !ready) return;
    stopAutoplay();
    const runId = interrupt();
    setUserText('');
    const index = matchQuestion(persona, text);
    const item = index >= 0
      ? { ...persona.questions[index], q: text }
      : { q: text, a: FALLBACK_ANSWER, cta: true };
    playExchange(runId, item, { questionIndex: index, typeQuestion: false });
  };

  const remaining = persona.questions.map((item, index) => ({ ...item, index })).filter((item) => !asked.includes(item.index));
  const Icon = persona.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Headline */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#ff9b72]">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden="true" />
          Free AI agent builder · No code
        </p>
        <h1 id="qlynk-hero-title" className="text-[clamp(2.3rem,5.4vw,4.4rem)] font-black leading-[1.04] tracking-[-0.045em] text-white">
          Feed it your knowledge.
          <span className="block">
            It becomes your{' '}
            <span className="relative inline-block min-w-[4ch] text-left align-bottom">
              <AnimatePresence mode="wait">
                <motion.span
                  key={persona.id}
                  className="inline-block"
                  style={{ color: persona.accent }}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 22, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -22, filter: 'blur(6px)' }}
                  transition={{ duration: 0.35 }}
                >
                  {persona.becomes}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
          Qlynk turns your documents, FAQs and links into an AI agent that answers questions for you, 24/7. Share it as a link or put it on your website.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={signupHref}
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-orange px-6 py-3.5 text-base font-black text-white shadow-[0_8px_28px_rgba(235,94,40,0.25)] transition-colors hover:bg-[#cc4b1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0c1019]"
          >
            {isSignedIn ? 'Open your dashboard' : 'Create your free agent'}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <a href="#live-demo" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89]">
            See it in action <span aria-hidden="true">↓</span>
          </a>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Free forever <span className="px-1 text-gray-600" aria-hidden="true">·</span> No card required <span className="px-1 text-gray-600" aria-hidden="true">·</span> 5,000 messages/month
        </p>
      </div>

      {/* Interactive demo */}
      <div id="live-demo" role="region" aria-labelledby="live-demo-title" className="relative mx-auto mt-12 max-w-6xl scroll-mt-24">
        <div className="mb-4 flex flex-col items-center gap-3">
          <h2 id="live-demo-title" className="text-sm font-bold text-white">
            Pick what your agent should be <span className="text-gray-500">↓</span>
          </h2>
          <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0" role="group" aria-label="Example use cases">
            {PERSONAS.map((item, index) => {
              const ItemIcon = item.icon;
              const isActive = index === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (isActive ? stopAutoplay() : goTo(index, true))}
                  aria-pressed={isActive}
                  className={`relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89] ${isActive ? 'text-white' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/25 hover:text-white'}`}
                  style={isActive ? { borderColor: `${item.accent}99`, background: `${item.accent}22` } : undefined}
                >
                  <ItemIcon size={15} style={isActive ? { color: item.accent } : undefined} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="h-4 text-[11px] text-gray-500" aria-live="polite">
            {autoplay ? 'Playing examples. Click a use case or a question to take over.' : 'Your turn: ask a question or try another use case.'}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0e16]/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
          <motion.div
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full blur-[110px]"
            animate={{ background: persona.accent, opacity: 0.16 }}
            transition={{ duration: 0.8 }}
            aria-hidden="true"
          />

          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_200px_minmax(0,1.25fr)] lg:items-center lg:gap-0">
            {/* 1. Knowledge */}
            <div className="min-w-0">
              <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                <span style={{ color: persona.accent }}>01</span> · You add knowledge
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
                {persona.files.map((file, index) => {
                  const learned = fed > index;
                  const feeding = fed === index && !ready;
                  const FileIcon = file.link ? Link2 : FileText;
                  return (
                    <motion.div
                      key={`${persona.id}-${file.name}`}
                      className="flex min-w-[200px] items-center gap-3 rounded-xl border bg-white/[0.035] px-3 py-2.5 lg:min-w-0"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        borderColor: learned ? `${persona.accent}66` : 'rgba(255,255,255,0.08)',
                      }}
                      transition={{ duration: 0.35, delay: index * 0.07 }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5" style={{ color: learned ? persona.accent : '#9ca3af' }}>
                        <FileIcon size={17} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{file.name}</span>
                        <span className="block text-[11px] text-gray-500">{file.meta}</span>
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold">
                        {learned ? (
                          <span className="inline-flex items-center gap-1" style={{ color: persona.accent }}><Check size={13} aria-hidden="true" /> <span className="hidden sm:inline">Learned</span></span>
                        ) : feeding ? (
                          <Loader2 size={14} className="animate-spin text-gray-400" aria-label="Reading" />
                        ) : (
                          <span className="text-gray-600">Queued</span>
                        )}
                      </span>
                    </motion.div>
                  );
                })}
                <Link
                  href={signupHref}
                  className="flex min-w-[200px] items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-sm text-gray-400 transition-colors hover:border-white/30 hover:text-white lg:min-w-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"><Plus size={17} aria-hidden="true" /></span>
                  Add your own PDFs, FAQs, links…
                </Link>
              </div>
            </div>

            {/* 2. Agent core */}
            <div className="relative flex items-center lg:flex-col">
              <div className="pointer-events-none absolute inset-x-0 top-[88px] hidden items-center lg:flex" aria-hidden="true">
                <FlowLine active={!ready} accent={persona.accent} />
                <div className="w-40 shrink-0" />
                <FlowLine active={streaming} accent={persona.accent} />
              </div>
              <div className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 lg:flex-col lg:gap-3 lg:border-0 lg:bg-transparent lg:p-0 lg:py-4">
                <div className="lg:hidden"><AgentCore persona={persona} fed={fed} ready={ready} compact /></div>
                <div className="hidden lg:block"><AgentCore persona={persona} fed={fed} ready={ready} /></div>
                <div className="min-w-0 lg:text-center">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    <span style={{ color: persona.accent }}>02</span> · Qlynk learns it
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={ready ? `${persona.id}-ready` : `${persona.id}-${fed}`}
                      className="mt-1 text-sm font-bold text-white"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {ready ? 'Agent ready' : `Reading ${Math.min(fed + 1, persona.files.length)} of ${persona.files.length}…`}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 3. Chat */}
            <div className="min-w-0">
              <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                <span style={{ color: persona.accent }}>03</span> · It answers for you
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12]">
                <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-gray-400">qlynk.site/{persona.slug}</span>
                </div>

                <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                  <motion.span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    animate={{ background: ready ? persona.accent : 'rgba(255,255,255,0.08)' }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon size={17} aria-hidden="true" />
                  </motion.span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{persona.name}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-[#2AB59E]' : 'bg-gray-600'}`} aria-hidden="true" />
                      {ready ? `Online · answers from ${persona.files.length} sources` : 'Learning…'}
                    </p>
                  </div>
                </div>

                <div ref={scrollRef} className="custom-scrollbar h-[300px] space-y-3 overflow-y-auto px-4 py-4 sm:h-[320px]" role="log" aria-label="Example conversation" aria-live="polite">
                  {!ready && messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      Learning from {persona.files.length} sources…
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {message.role === 'user' ? (
                          <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-white">{message.text}</p>
                        ) : (
                          <div className="max-w-[92%]">
                            <div className="rounded-2xl rounded-tl-sm border px-3.5 py-2.5 text-sm leading-relaxed text-gray-100" style={{ borderColor: `${persona.accent}33`, background: `${persona.accent}14` }}>
                              {message.text ? message.text : (
                                <span className="flex items-center gap-1 py-1" aria-label="Typing">
                                  {[0, 1, 2].map((dot) => (
                                    <motion.span
                                      key={dot}
                                      className="h-1.5 w-1.5 rounded-full bg-gray-400"
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
                                    />
                                  ))}
                                </span>
                              )}
                            </div>
                            {message.done && (message.source || message.handoff || message.cta) && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                                {message.handoff ? (
                                  <><UserRound size={12} style={{ color: persona.accent }} aria-hidden="true" /> Handed off to your team</>
                                ) : message.cta ? (
                                  <Link href={signupHref} className="inline-flex items-center gap-1 font-bold hover:underline" style={{ color: persona.accent }}>
                                    Build your own agent free <ArrowRight size={12} aria-hidden="true" />
                                  </Link>
                                ) : (
                                  <><FileText size={12} style={{ color: persona.accent }} aria-hidden="true" /> Answered from <span className="font-semibold text-gray-300">{message.source}</span></>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-white/5 px-3 pb-3 pt-2.5">
                  <div className="mb-2.5 flex min-h-[30px] flex-wrap gap-1.5">
                    {ready && remaining.length > 0 && remaining.map((item) => (
                      <button
                        key={item.index}
                        type="button"
                        onClick={() => askQuestion(item.index)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89]"
                        onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${persona.accent}88`; }}
                        onMouseLeave={(event) => { event.currentTarget.style.borderColor = ''; }}
                      >
                        {item.q}
                      </button>
                    ))}
                    {ready && remaining.length === 0 && !streaming && (
                      <Link href={signupHref} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: persona.accent }}>
                        Build a {persona.label.toLowerCase()} agent like this, free <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 transition-colors focus-within:border-white/25">
                    <label htmlFor="hero-demo-input" className="sr-only">Ask the example agent a question</label>
                    <input
                      id="hero-demo-input"
                      value={draft || userText}
                      onChange={(event) => setUserText(event.target.value)}
                      onFocus={() => { if (draft) { stopAutoplay(); interrupt(); } else { stopAutoplay(); } }}
                      maxLength={200}
                      autoComplete="off"
                      placeholder={ready ? 'Ask your own question…' : 'Learning…'}
                      className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!userText.trim() || !ready}
                      aria-label="Send question"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-35"
                      style={{ background: persona.accent }}
                    >
                      <Send size={15} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-gray-500">Example agents with fictional data. Yours answers from whatever you add.</p>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-white/[0.07] pt-5 text-xs text-gray-400 sm:justify-between">
        <a href="https://github.com/randomzzguy/qlynk2.0" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-2 transition-colors hover:text-[#ff9b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89]">
          <Code2 size={16} aria-hidden="true" /> Open source under MIT <ArrowRight size={12} aria-hidden="true" />
        </a>
        <Link href="/blog/qlynk-project-of-the-day-smol-hunt" className="inline-flex min-h-8 items-center gap-2 transition-colors hover:text-[#ff9b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89]">
          <Trophy size={14} aria-hidden="true" /> #1 Project of the Day on Smol Hunt
        </Link>
      </div>
    </div>
  );
}
