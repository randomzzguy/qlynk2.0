import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

export default function PlatformComparisonPage({ comparison, slug }) {
  const path = `/compare/${slug}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Compare', path: '/compare' },
        { name: `Qlynk vs ${comparison.vendor}`, path },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: comparison.title,
        description: comparison.description,
        datePublished: comparison.datePublished,
        dateModified: comparison.dateModified,
        mainEntityOfPage: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: 'Qlynk AI' },
        publisher: { '@type': 'Organization', name: 'Qlynk AI' },
      }} />
      <MarketingHeader />
      <main>
        <header className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Feature review · Updated {comparison.updatedLabel}</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Qlynk vs {comparison.vendor}</h1>
          <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300">{comparison.summary}</p>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-gray-500">This comparison is published by Qlynk. Competitor details come from the official sources linked below; verify requirements and current prices before purchasing.</p>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-orange/40 bg-orange/10 p-8">
              <h2 className="text-2xl font-black">Choose Qlynk when</h2>
              <ul className="mt-6 space-y-4 text-gray-300">
                {comparison.qlynkBestFor.map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-orange" size={20} />{item}</li>)}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-black">Choose {comparison.vendor} when</h2>
              <ul className="mt-6 space-y-4 text-gray-300">
                {comparison.vendorBestFor.map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-gray-400" size={20} />{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20">
          <div className="mx-auto max-w-7xl overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="mb-8 text-left text-3xl font-black">Capability comparison</caption>
              <thead><tr className="border-b border-white/20"><th className="p-5 text-gray-400">Area</th><th className="p-5 text-orange">Qlynk</th><th className="p-5">{comparison.vendor}</th></tr></thead>
              <tbody>{comparison.rows.map(([area, qlynk, vendor]) => <tr key={area} className="border-b border-white/10 align-top"><th className="p-5 font-bold">{area}</th><td className="p-5 leading-relaxed text-gray-300">{qlynk}</td><td className="p-5 leading-relaxed text-gray-400">{vendor}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl font-black">Methodology and sources</h2>
            <p className="mt-5 leading-relaxed text-gray-400">Qlynk details were checked against the current product, plan configuration, and public pages. Competitor details were checked against the official pages below on August 14, 2026. We compare practical purchasing criteria, avoid a made-up overall score, and do not treat an undocumented feature as proof that it cannot exist.</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
              {comparison.sources.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange hover:underline">{label} <ExternalLink size={14} /></a>)}
            </div>
          </div>
          <aside className="rounded-3xl border border-white/10 p-8">
            <h2 className="text-2xl font-black">Run your own test</h2>
            <p className="mt-4 leading-relaxed text-gray-400">Load the same approved sources, ask the same routine and edge-case questions, test missing information, and compare total cost at your expected usage.</p>
            <Link href="/blog/best-ai-agent-platforms" className="mt-6 inline-flex items-center gap-2 font-bold text-orange">Open the evaluation framework <ArrowRight size={17} /></Link>
          </aside>
        </section>

        <section className="px-6 pb-24 text-center">
          <div className="mx-auto max-w-5xl rounded-3xl bg-orange p-10 md:p-14">
            <h2 className="text-3xl font-black md:text-5xl">Build and test the focused version</h2>
            <p className="mx-auto mt-4 max-w-2xl text-orange-50">Use approved business knowledge, define the boundaries, and review real answers before choosing a long-term platform.</p>
            <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-[#9a3412] transition-colors hover:bg-orange-50 hover:text-[#7c2d12]">Start Free <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
