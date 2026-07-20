import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata, SITE_URL } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'AI Agent Platform Comparisons | Qlynk AI',
  description: 'Compare AI agent platforms by use case, knowledge, controls, publishing, actions, pricing, and ownership—not marketing labels.',
  path: '/compare',
});

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Compare', path: '/compare' }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'AI agent platform comparisons', url: `${SITE_URL}/compare` }} />
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <header className="max-w-4xl">
          <Scale className="text-orange" size={36} />
          <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-orange">Transparent comparisons</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Choose the right agent for the job</h1>
          <p className="mt-7 text-xl leading-relaxed text-gray-300">We compare current public capabilities, name meaningful tradeoffs, link to vendor sources, and date every review. Features change, so verify critical requirements before buying.</p>
        </header>
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <Link href="/compare/qlynk-vs-chatbase" className="group rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-orange/40">
            <p className="text-sm font-black uppercase tracking-wider text-orange">Updated July 21, 2026</p>
            <h2 className="mt-4 text-3xl font-black group-hover:text-orange">Qlynk vs Chatbase</h2>
            <p className="mt-4 leading-relaxed text-gray-400">A focused publishing-and-governance agent compared with a broader customer-service platform offering integrations and actions.</p>
            <span className="mt-8 inline-flex items-center gap-2 font-bold">Read the comparison <ArrowRight size={17} /></span>
          </Link>
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-gray-500">
            <p className="text-sm font-black uppercase tracking-wider">Evaluation framework</p>
            <h2 className="mt-4 text-2xl font-black text-white">Compare your own shortlist</h2>
            <p className="mt-4 leading-relaxed">Use the same questions, sources, edge cases, pricing assumptions, and handoff tests for every platform.</p>
            <Link href="/blog/best-ai-agent-platforms" className="mt-8 inline-flex items-center gap-2 font-bold text-orange">Open the buyer’s guide <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
