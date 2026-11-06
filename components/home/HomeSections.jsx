'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Code2,
  CreditCard,
  FileText,
  Link2,
  MessageSquare,
  Pencil,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

// Shared visual language with HomepageHero: dark glass panels, mono eyebrows,
// and the same per-use-case accent colours.
const ACCENTS = {
  support: '#EB5E28',
  onboarding: '#2AB59E',
  restaurant: '#F5A524',
  freelancer: '#A78BFA',
  course: '#38BDF8',
  clinic: '#F472B6',
};

const PANEL = 'rounded-3xl border border-white/10 bg-[#0b0e16]/80 backdrop-blur-md';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

function Eyebrow({ children, color = '#EB5E28' }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, children, align = 'center' }) {
  const centered = align === 'center';
  return (
    <motion.div {...fadeUp} className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)] font-black leading-[1.06] tracking-[-0.04em] text-white">{title}</h2>
      {children && <p className={`mt-4 text-base leading-relaxed text-gray-400 sm:text-lg ${centered ? 'mx-auto max-w-2xl' : ''}`}>{children}</p>}
    </motion.div>
  );
}

/* ---------- 1. The questions you keep answering ---------- */

const QUESTION_ROWS = [
  [
    ['support', 'Do you ship to Canada?'],
    ['onboarding', 'How many vacation days do I get?'],
    ['restaurant', 'Are you open on Sunday night?'],
    ['course', 'When is project 2 due?'],
    ['clinic', 'Do you take walk-ins?'],
    ['freelancer', "What's your rate for a landing page?"],
    ['support', 'Can I return a worn item?'],
    ['onboarding', 'Where do I submit expenses?'],
  ],
  [
    ['restaurant', 'Anything gluten-free on the menu?'],
    ['clinic', "What's your cancellation policy?"],
    ['freelancer', 'Have you worked with fintech apps?'],
    ['course', 'How is the final project graded?'],
    ['support', 'Where is my order?'],
    ['onboarding', 'How do I set up my work email?'],
    ['clinic', 'Is parking available?'],
    ['restaurant', 'Can I book a table for 12?'],
  ],
];

function QuestionPill({ kind, text }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-200">
      <span className="h-2 w-2 rounded-full" style={{ background: ACCENTS[kind], boxShadow: `0 0 10px ${ACCENTS[kind]}` }} aria-hidden="true" />
      {text}
    </span>
  );
}

export function QuestionsWall() {
  return (
    <section className="relative z-10 overflow-hidden py-20 sm:py-28" aria-labelledby="questions-wall-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who it's for"
          title={<span id="questions-wall-title">If people keep asking, <span className="text-[#ff8a5b]">it keeps answering.</span></span>}
        >
          Shops, teams, restaurants, clinics, teachers, freelancers. If you answer the same questions every week, a Qlynk agent can answer them for you, day or night.
        </SectionHeading>
      </div>

      <div className="relative mt-12 space-y-3 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" aria-hidden="true">
        {QUESTION_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex overflow-hidden">
            <div className={`qlynk-marquee flex shrink-0 gap-3 pr-3 ${rowIndex === 1 ? 'qlynk-marquee-reverse' : ''}`}>
              {[...row, ...row].map(([kind, text], index) => (
                <QuestionPill key={`${text}-${index}`} kind={kind} text={text} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {QUESTION_ROWS.flat().map(([, text]) => <li key={text}>{text}</li>)}
      </ul>
    </section>
  );
}

/* ---------- 2. You stay in control ---------- */

function SourcePreview() {
  return (
    <div className="space-y-2">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 px-3.5 py-2 text-sm text-white">Do you deliver on weekends?</p>
      <p className="max-w-[92%] rounded-2xl rounded-tl-sm border border-orange/25 bg-orange/10 px-3.5 py-2.5 text-sm leading-relaxed text-gray-100">Yes, Saturday delivery is available in the city for $5.</p>
      <p className="flex items-center gap-1.5 text-[11px] text-gray-400"><FileText size={12} className="text-orange" aria-hidden="true" /> Answered from <span className="font-semibold text-gray-300">Delivery FAQ.pdf</span></p>
    </div>
  );
}

function HandoffPreview() {
  return (
    <div className="space-y-2">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 px-3.5 py-2 text-sm text-white">I need help with a refund dispute</p>
      <div className="flex items-center gap-3 rounded-2xl border border-[#2AB59E]/30 bg-[#2AB59E]/10 px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2AB59E] text-white"><UserRound size={15} aria-hidden="true" /></span>
        <p className="text-sm leading-snug text-gray-100">Passed to <span className="font-semibold text-white">your team</span>. They&apos;ll reply by email.</p>
      </div>
    </div>
  );
}

function EditPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-gray-500">QUESTION</p>
          <p className="mt-1 text-sm font-bold text-white">What are your holiday hours?</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5A524]/15 text-[#F5A524]"><Pencil size={14} aria-hidden="true" /></span>
      </div>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-gray-500">YOUR ANSWER</p>
        <p className="mt-1 text-sm text-gray-300">Closed Dec 25–26. Open 10am–4pm on the 24th<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-[#F5A524] align-middle" /></p>
      </div>
    </div>
  );
}

function InsightsPreview() {
  return (
    <div className="space-y-3">
      {[['Shipping & delivery', '78%', '#A78BFA'], ['Returns', '52%', '#A78BFA'], ['Sizing', '31%', '#A78BFA']].map(([label, width, color]) => (
        <div key={label}>
          <div className="mb-1.5 flex justify-between text-xs text-gray-400"><span>{label}</span><span>{width}</span></div>
          <div className="h-1.5 rounded-full bg-white/10">
            <motion.div className="h-1.5 rounded-full" style={{ background: color }} initial={{ width: 0 }} whileInView={{ width }} viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          </div>
        </div>
      ))}
      <p className="rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs text-gray-400">
        <span className="font-semibold text-white">Knowledge gap:</span> &ldquo;Do you offer gift wrapping?&rdquo;
      </p>
    </div>
  );
}

const CONTROLS = [
  { icon: FileText, color: '#EB5E28', title: 'Answers from your content', desc: 'It answers from the documents, FAQs and links you add, and shows where each answer came from.', preview: SourcePreview },
  { icon: MessageSquare, color: '#2AB59E', title: 'Hands off to a person', desc: "When a question needs a human, or it doesn't know, it passes the conversation to you.", preview: HandoffPreview },
  { icon: Pencil, color: '#F5A524', title: 'Change answers anytime', desc: 'Prices changed? New policy? Update it in the dashboard and the agent knows right away.', preview: EditPreview },
  { icon: BarChart3, color: '#A78BFA', title: 'See what people ask', desc: "Spot popular topics and the questions it couldn't answer, so you know what to add next.", preview: InsightsPreview },
];

export function ControlSection() {
  return (
    <section className="relative z-10 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="You stay in control" title="An agent that sticks to what you told it.">
          You decide what it knows, what it can talk about, and when a person should step in.
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {CONTROLS.map((item, index) => {
            const Preview = item.preview;
            return (
              <motion.article
                key={item.title}
                className={`${PANEL} group relative overflow-hidden p-6 sm:p-7`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: (index % 2) * 0.1 }}
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-[70px] transition-opacity duration-500 group-hover:opacity-30" style={{ background: item.color }} aria-hidden="true" />
                <div className="relative grid gap-6 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
                  <div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${item.color}1f`, color: item.color }}>
                      <item.icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-[#0c0c12] p-4">
                    <Preview />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Where it lives ---------- */

export function WhereItLives() {
  return (
    <section className="relative z-10 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Where it lives" title="Put it wherever people ask you things.">
          Every agent gets its own page and a website widget. No code needed, and setup takes minutes.
        </SectionHeading>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Hosted link */}
          <motion.article {...fadeUp} className={`${PANEL} overflow-hidden p-6 sm:p-7`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15 text-orange"><Link2 size={19} aria-hidden="true" /></span>
              <div>
                <h3 className="text-xl font-black tracking-[-0.02em] text-white">Share a link</h3>
                <p className="text-sm text-gray-400">In your bio, email signature, QR code or group chat.</p>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" /></span>
                <span className="mx-auto rounded-md bg-white/5 px-3 py-1 font-mono text-[11px] text-gray-300">qlynk.site/<span className="text-orange">yourname</span></span>
              </div>
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-[#c14f22] text-lg font-black text-white shadow-lg shadow-orange/20">B</span>
                <p className="mt-3 font-bold text-white">Bloom &amp; Co. Help</p>
                <p className="text-xs text-gray-500">Ask about orders, returns or sizing</p>
                <div className="mt-5 flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                  <span className="flex-1 px-2 text-left text-sm text-gray-500">Ask a question…</span>
                  <span className="h-8 w-8 rounded-lg bg-orange" aria-hidden="true" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500"><QrCode size={13} aria-hidden="true" /> QR code included</div>
              </div>
            </div>
          </motion.article>

          {/* Website widget */}
          <motion.article {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className={`${PANEL} overflow-hidden p-6 sm:p-7`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-[#38BDF8]"><Code2 size={19} aria-hidden="true" /></span>
              <div>
                <h3 className="text-xl font-black tracking-[-0.02em] text-white">Add it to your website</h3>
                <p className="text-sm text-gray-400">Paste one line. Works with any site builder.</p>
              </div>
            </div>
            <div className="relative mt-6 h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-5">
              <div className="space-y-3" aria-hidden="true">
                <div className="flex items-center justify-between"><span className="h-3 w-20 rounded bg-white/15" /><span className="flex gap-2"><span className="h-2 w-10 rounded bg-white/10" /><span className="h-2 w-10 rounded bg-white/10" /><span className="h-2 w-10 rounded bg-white/10" /></span></div>
                <div className="pt-4"><span className="block h-5 w-2/3 rounded bg-white/10" /><span className="mt-2 block h-5 w-1/2 rounded bg-white/10" /></div>
                <span className="block h-2 w-3/4 rounded bg-white/5" /><span className="block h-2 w-2/3 rounded bg-white/5" />
                <div className="grid grid-cols-3 gap-2 pt-2"><span className="h-14 rounded-lg bg-white/[0.04]" /><span className="h-14 rounded-lg bg-white/[0.04]" /><span className="h-14 rounded-lg bg-white/[0.04]" /></div>
              </div>
              <motion.div
                className="absolute bottom-16 right-4 w-[210px] rounded-2xl border border-white/10 bg-[#141826] p-3 shadow-2xl"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p className="text-[11px] font-bold text-white">Bloom &amp; Co. Help</p>
                <p className="mt-2 rounded-xl rounded-tl-sm bg-orange/15 px-2.5 py-2 text-[11px] leading-snug text-gray-200">Hi! Need help with an order?</p>
              </motion.div>
              <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange text-white shadow-lg shadow-orange/30"><MessageSquare size={17} aria-hidden="true" /></span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-400"><code><span className="text-[#38BDF8]">&lt;script</span> src=<span className="text-[#F5A524]">&quot;qlynk.site/qlynk-agent.js&quot;</span> data-widget-id=<span className="text-[#F5A524]">&quot;…&quot;</span><span className="text-[#38BDF8]">&gt;&lt;/script&gt;</span></code></pre>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Free plan ---------- */

const PLAN_FACTS = [
  { icon: ShieldCheck, title: 'Free forever', desc: 'The Creator plan never expires.' },
  { icon: MessageSquare, title: '5,000 messages', desc: 'Every month, included.' },
  { icon: CreditCard, title: 'No card needed', desc: 'Sign up and start building.' },
  { icon: Code2, title: 'Open source', desc: 'MIT licensed on GitHub.' },
];

export function FreePlanSection() {
  return (
    <section className="relative z-10 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className={`${PANEL} relative overflow-hidden p-6 sm:p-10`}>
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#2AB59E]/15 blur-[100px]" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow color="#2AB59E">Pricing</Eyebrow>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">Free to build. Free to keep.</h2>
              <p className="mt-3 max-w-md leading-relaxed text-gray-400">
                Use the full product on the free Creator plan. Upgrade to Agency only if you need more messages or want to remove Qlynk branding.
              </p>
              <Link href="/pricing" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#2AB59E] hover:underline">
                See pricing <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PLAN_FACTS.map((fact) => (
                <div key={fact.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <fact.icon size={18} className="text-[#2AB59E]" aria-hidden="true" />
                  <p className="mt-3 font-black text-white">{fact.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{fact.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 5. FAQ ---------- */

export function HomeFAQ({ faqs }) {
  return (
    <section className="relative z-10 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions? Fittingly, we have answers." />
        <div className="mt-10 space-y-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-white/10 bg-[#0b0e16]/80 backdrop-blur-md transition-colors open:border-orange/30">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 font-bold text-white marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff8a5b] sm:px-6">
                {question}
                <span className="text-2xl font-light text-[#ff8a5b] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-gray-400 sm:px-6">{answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-7 text-center text-sm text-gray-400">
          Still curious? <Link href="/faq" className="font-bold text-[#ff8a5b] hover:underline">Read the full FAQ</Link> or ask the Qlynk agent in the corner.
        </p>
      </div>
    </section>
  );
}

/* ---------- 6. Final call to action ---------- */

const CTA_WORDS = [
  ['support team', ACCENTS.support],
  ['onboarding buddy', ACCENTS.onboarding],
  ['restaurant host', ACCENTS.restaurant],
  ['portfolio', ACCENTS.freelancer],
  ['teaching assistant', ACCENTS.course],
];

export function FinalCTA({ isSignedIn = false }) {
  return (
    <section className="relative z-10 pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className={`${PANEL} relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20`}>
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-orange/20 blur-[120px]" aria-hidden="true" />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.04] tracking-[-0.045em] text-white">
              Feed it your knowledge.<br />
              <span className="text-[#ff8a5b]">Launch it today.</span>
            </h2>
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2" aria-label="Things your agent can become">
              {CTA_WORDS.map(([word, color]) => (
                <span key={word} className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-300" style={{ borderColor: `${color}55`, background: `${color}12` }}>
                  {word}
                </span>
              ))}
              <span className="px-1 text-xs font-semibold text-gray-500">or anything else</span>
            </div>
            <Link
              href={isSignedIn ? '/dashboard' : '/auth/signup'}
              className="mt-9 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-orange px-7 py-3.5 text-base font-black text-white shadow-[0_8px_28px_rgba(235,94,40,0.3)] transition-colors hover:bg-[#cc4b1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0c1019]"
            >
              {isSignedIn ? 'Open your dashboard' : 'Create your free agent'} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">Free forever · No card required · 5,000 messages/month</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
