import Link from 'next/link';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

export default function MarketingLandingPage({ page, path }) {
  const schema = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: page.eyebrow, path },
  ]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <JsonLd data={schema} />
      <MarketingHeader />
      <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />
      <main className="max-w-5xl mx-auto px-6 py-28 relative z-10">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-12">
          <Link href="/" className="hover:text-white">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>{page.eyebrow}</span>
        </nav>

        <header className="max-w-4xl mb-20">
          <p className="text-orange font-bold uppercase tracking-[0.18em] text-sm mb-5">{page.eyebrow}</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-7">{page.title}</h1>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">{page.description}</p>
        </header>

        <section aria-labelledby="definition-heading" className="mb-20 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
          <h2 id="definition-heading" className="text-3xl font-bold mb-5">What this means in Qlynk</h2>
          <p className="text-lg text-gray-300 leading-relaxed">{page.definition}</p>
        </section>

        <section aria-labelledby="benefits-heading" className="mb-20">
          <h2 id="benefits-heading" className="text-3xl md:text-4xl font-bold mb-10">From repeated question to useful answer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {page.benefits.map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-7">
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-[#f46530] to-[#c14f22] p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Build the agent around what people need to know</h2>
          <p className="text-orange-50 mb-8">Start with a 14-day free trial, choose its information and limits, then share your {SITE_URL.replace('https://www.', '')}/username link.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="rounded-xl bg-white px-7 py-4 font-bold text-[#9a3412] transition-colors hover:bg-orange-50 hover:text-[#7c2d12]">Start free</Link>
            <Link href="/pricing" className="rounded-xl border border-white/40 px-7 py-4 font-bold">View Pricing</Link>
            <Link href="/faq" className="rounded-xl border border-white/40 px-7 py-4 font-bold">Read the FAQ</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
