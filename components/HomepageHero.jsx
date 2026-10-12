'use client';

import Link from 'next/link';
import { ArrowRight, Check, Code2, PlayCircle, Trophy } from 'lucide-react';

import HomepageAgentDemo from '@/components/HomepageAgentDemo';

export default function HomepageHero({ isSignedIn = false }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 xl:gap-16">
        <div className="max-w-xl">
          <p className="mb-6 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#ff9b72] sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-orange" aria-hidden="true" />
            AI answers from your own content
          </p>
          <h1 id="qlynk-hero-title" className="text-[clamp(2.6rem,5.1vw,4.5rem)] font-black leading-[1.06] tracking-[-0.045em] text-white">
            An AI guide for<br className="hidden sm:block" /> the questions you<br className="hidden sm:block" />{' '}
            <span className="text-[#ff8a5b]">keep answering.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-[1.8] text-gray-300 sm:text-lg">
            Add your FAQs, documents, and links. Qlynk answers visitors’ questions about your business or work. Share your guide with a link or embed it on your website. No coding needed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={isSignedIn ? '/dashboard' : '/auth/signup'}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-orange px-6 py-3.5 text-base font-black text-white shadow-[0_8px_28px_rgba(235,94,40,0.2)] transition-colors hover:bg-[#cc4b1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0c1019]"
            >
              {isSignedIn ? 'Open your dashboard' : 'Create your free guide'}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#live-demo" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold text-gray-200 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad89]">
              <PlayCircle size={19} aria-hidden="true" /> Try the live demo
            </a>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Free forever <span className="px-1 text-gray-600" aria-hidden="true">·</span> No card required <span className="px-1 text-gray-600" aria-hidden="true">·</span> 5,000 messages/month
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm text-gray-400" aria-label="How to create a Qlynk guide">
            {['Add your knowledge', 'Set its boundaries', 'Share it anywhere'].map((step) => (
              <span key={step} className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#ff9b72]" aria-hidden="true" />{step}</span>
            ))}
          </div>
        </div>

        <div id="live-demo" role="region" aria-labelledby="live-demo-title" className="relative min-w-0 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="live-demo-title" className="text-sm font-bold tracking-wide text-white">Try a Qlynk guide, right here</h2>
            <span className="inline-flex items-center gap-2 text-xs text-gray-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2AB59E]" aria-hidden="true" /> Live demo · No signup
            </span>
          </div>
          <HomepageAgentDemo />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-white/[0.07] pt-5 text-xs text-gray-400 sm:mt-12 sm:justify-between">
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
