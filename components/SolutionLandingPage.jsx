import Link from 'next/link';
import { ArrowRight, Check, MessageSquareText, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';
import { authorityArticles } from '@/lib/authority-articles';
import { solutionPages } from '@/lib/solution-pages';

export default function SolutionLandingPage({ page }) {
  const path = `/solutions/${page.slug}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: `${SITE_URL}${path}`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
        audience: { '@type': 'Audience', audienceType: page.audience },
      }} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Solutions', path: '/solutions' },
        { name: page.shortTitle, path },
      ])} />
      <MarketingHeader />

      <main>
        <header className="relative overflow-hidden border-b border-white/10 px-6 py-20 md:py-28">
          <div className="absolute left-1/2 top-0 h-[30rem] w-[56rem] -translate-x-1/2 rounded-full bg-orange/10 blur-[150px]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
              <Link href="/solutions" className="hover:text-white">Solutions</Link>
              <span aria-hidden="true" className="mx-2">/</span>
              <span>{page.shortTitle}</span>
            </nav>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-orange">Turn approved knowledge into trusted answers</p>
            <h1 className="text-4xl font-black tracking-tight md:text-7xl">{page.title}</h1>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300">{page.description}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-xl bg-orange px-7 py-4 font-bold text-white transition-colors hover:bg-[#c14f22]">
                Start Free <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/pricing" className="rounded-xl border border-white/15 px-7 py-4 font-bold text-white hover:border-orange/50">See transparent pricing</Link>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-300">14-day free trial · Every feature included · No payment today</p>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange">What it is</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">A focused agent, not an open-ended promise</h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-300">{page.what}</p>
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <ShieldCheck className="text-orange" size={32} />
            <h2 className="mt-5 text-xl font-black">Who it is for</h2>
            <p className="mt-3 leading-relaxed text-gray-400">{page.audience}</p>
          </aside>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-orange">Benefits</p>
            <h2 className="mt-4 text-center text-3xl font-black md:text-5xl">Designed around trustworthy usefulness</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {page.benefits.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-gray-950 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange"><Check size={22} /></div>
                  <h3 className="mt-6 text-xl font-black">{title}</h3>
                  <p className="mt-3 leading-relaxed text-gray-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange">How it works</p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">From source material to a shareable agent</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {page.steps.map(([title, text], index) => (
              <li key={title} className="rounded-3xl border border-white/10 p-8">
                <span className="text-4xl font-black text-orange/40">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-relaxed text-gray-400">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 md:pb-24">
          <div className="rounded-3xl border border-orange/30 bg-orange/10 p-8 md:p-12">
            <div className="flex items-center gap-3 text-orange"><MessageSquareText size={25} /><span className="text-sm font-black uppercase tracking-[0.18em]">Example conversation</span></div>
            <div className="mt-8 space-y-4">
              <div className="ml-auto max-w-2xl rounded-2xl bg-white px-5 py-4 text-gray-900"><strong>Visitor:</strong> {page.example.question}</div>
              <div className="max-w-2xl rounded-2xl border border-white/10 bg-gray-950 px-5 py-4 text-gray-200"><strong className="text-orange">AI agent:</strong> {page.example.answer}</div>
            </div>
            <p className="mt-5 text-sm text-gray-500">Illustrative response. The published answer depends on the knowledge and rules the owner approves.</p>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20 md:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange">Frequently asked questions</p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">What to know before you build</h2>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {page.faqs.map(([question, answer]) => (
                <details key={question} className="group py-6">
                  <summary className="cursor-pointer list-none pr-8 text-lg font-bold">{question}</summary>
                  <p className="mt-4 max-w-3xl leading-relaxed text-gray-400">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <h2 className="text-3xl font-black">Related solutions</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.related.filter((slug) => solutionPages[slug] || authorityArticles[slug]).map((slug) => {
              const isSolution = Boolean(solutionPages[slug]);
              const related = solutionPages[slug] || authorityArticles[slug];
              return <Link key={slug} href={isSolution ? `/solutions/${slug}` : `/blog/${slug}`} className="group rounded-2xl border border-white/10 p-6 hover:border-orange/40"><h3 className="font-black group-hover:text-orange">{related.shortTitle}</h3><p className="mt-2 text-sm leading-relaxed text-gray-500">{related.description}</p></Link>;
            })}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-[#f46530] to-[#c14f22] p-10 text-center md:p-14">
            <h2 className="text-3xl font-black md:text-5xl">Turn your approved knowledge into a trusted AI agent.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-orange-50">Start with one job, add what you know, define the limits, and share the result.</p>
            <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-[#9a3412] transition-colors hover:bg-orange-50 hover:text-[#7c2d12]">Start Free <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
