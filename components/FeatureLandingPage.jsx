import Link from 'next/link';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema } from '@/lib/seo';

export default function FeatureLandingPage({ feature, slug }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Features', path: '/#features' },
        { name: feature.title, path: `/features/${slug}` },
      ])} />
      <MarketingHeader />
      <main className="max-w-5xl mx-auto px-6 py-28">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-12">
          <Link href="/" className="hover:text-white">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>Features</span>
        </nav>
        <header className="max-w-4xl mb-16">
          <p className="text-orange uppercase tracking-[0.18em] font-bold text-sm mb-5">Qlynk feature</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-7">{feature.title}</h1>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">{feature.description}</p>
        </header>
        <section aria-labelledby="feature-details" className="grid md:grid-cols-3 gap-6 mb-20">
          <h2 id="feature-details" className="sr-only">Feature details</h2>
          {feature.points.map((point) => (
            <article key={point} className="border border-white/10 rounded-2xl bg-white/5 p-7">
              <h3 className="text-lg font-bold">{point}</h3>
            </article>
          ))}
        </section>
        <section className="border border-orange/30 bg-orange/10 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-5">Use it to answer the right questions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="bg-orange text-white rounded-xl px-7 py-4 font-bold">Start Free</Link>
            <Link href="/ai-agent" className="border border-white/20 rounded-xl px-7 py-4 font-bold">Explore the AI Agent Platform</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
