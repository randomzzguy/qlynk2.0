import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema } from '@/lib/seo';

export default function AudienceLandingPage({ page, path }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: page.eyebrow, path },
      ])} />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute left-1/2 top-0 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-orange/10 blur-[140px]" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-orange">{page.eyebrow}</p>
            <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">{page.title}</h1>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300 md:text-2xl">{page.description}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-xl bg-orange px-7 py-4 font-bold text-white transition-colors hover:bg-[#c14f22]">
                Start Free <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/ai-agent" className="rounded-xl border border-white/20 px-7 py-4 font-bold text-white transition-colors hover:border-orange/60">
                See how Qlynk works
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-[0.8fr_1.2fr] md:py-24">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-orange">The repeated questions</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Give people a useful first answer before they need you.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {page.questions.map((question) => (
              <div key={question} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-200">
                “{question}”
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="mb-10 max-w-3xl">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-orange">What your Qlynk Agent can handle</p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Built from the information and limits you provide.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {page.outcomes.map(([title, text]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-gray-950 p-7">
                  <CheckCircle2 className="mb-5 text-orange" size={28} />
                  <h3 className="mb-3 text-xl font-bold">{title}</h3>
                  <p className="leading-relaxed text-gray-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-black md:text-5xl">{page.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">{page.ctaText}</p>
          <Link href="/auth/signup" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-orange px-8 py-4 font-bold text-white transition-colors hover:bg-[#c14f22]">
            Start Free <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-300">14-day free trial · Every feature included · No payment today</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
