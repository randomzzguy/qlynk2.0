import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata, SITE_URL } from '@/lib/seo';
import { getSolutionsByCluster, solutionClusters } from '@/lib/solution-pages';

export const metadata = createMetadata({
  title: 'AI Agent Solutions | Qlynk AI',
  description: 'Explore trusted AI agents for experts, businesses, operations, properties, and places—built from approved knowledge and clear rules.',
  path: '/solutions',
  keywords: ['AI agent solutions', 'AI assistant builder', 'knowledge-based AI', 'business AI assistant'],
});

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Solutions', path: '/solutions' }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Qlynk AI agent solutions', url: `${SITE_URL}/solutions`, description: metadata.description }} />
      <MarketingHeader />
      <main>
        <header className="border-b border-white/10 px-6 py-24 text-center md:py-32">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">AI agent solutions</p>
          <h1 className="mx-auto mt-5 max-w-5xl text-5xl font-black tracking-tight md:text-7xl">One trusted idea, shaped for many real jobs</h1>
          <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300">Turn your approved knowledge into a trusted AI agent. Choose the use case closest to the questions your audience already asks.</p>
        </header>
        <div className="mx-auto max-w-7xl space-y-20 px-6 py-20 md:py-24">
          {solutionClusters.map((cluster) => (
            <section key={cluster.key} id={cluster.key}>
              <div className="max-w-3xl">
                <h2 className="text-3xl font-black md:text-5xl">{cluster.name}</h2>
                <p className="mt-4 text-lg text-gray-400">{cluster.description}</p>
              </div>
              <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {getSolutionsByCluster(cluster.key).map((page) => (
                  <Link key={page.slug} href={`/solutions/${page.slug}`} className="group rounded-3xl border border-white/10 bg-white/5 p-7 transition-all hover:-translate-y-1 hover:border-orange/40">
                    <h3 className="text-xl font-black group-hover:text-orange">{page.shortTitle}</h3>
                    <p className="mt-3 leading-relaxed text-gray-400">{page.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange">Explore solution <ArrowRight size={16} /></span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <section className="px-6 pb-24 text-center">
          <div className="mx-auto max-w-5xl rounded-3xl bg-orange p-10 md:p-14">
            <h2 className="text-3xl font-black md:text-5xl">Start with every feature free for 14 days</h2>
            <p className="mx-auto mt-4 max-w-2xl text-orange-50">14-day free trial · Every feature included · No payment today</p>
            <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-[#9a3412] transition-colors hover:bg-orange-50 hover:text-[#7c2d12]">Start Free <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
