import Image from 'next/image';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI Press Kit | Logos and Product Information',
  description: 'Download Qlynk brand assets and find the current official description of its focused AI agent platform.',
  path: '/press',
});

export default function PressPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Press Kit', path: '/press' }])} />
      <MarketingHeader />
      <main className="max-w-5xl mx-auto px-6 py-28">
        <header className="max-w-3xl mb-16">
          <p className="text-orange font-bold uppercase tracking-[0.18em] text-sm mb-5">Press Kit</p>
          <h1 className="text-5xl md:text-7xl font-black mb-7">Qlynk AI brand and product resources</h1>
          <p className="text-xl text-gray-300">Approved assets and concise descriptions for articles, directories, and other coverage.</p>
        </header>

        <section className="mb-16 rounded-3xl border border-amber-300/20 bg-amber-300/[0.07] p-8 md:p-10" aria-labelledby="recognition-heading">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
              <Trophy size={28} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">Recognition</p>
              <h2 id="recognition-heading" className="mt-3 text-3xl font-black">#1 Project of the Day on Smol Hunt</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-300">Smol Hunt ranked Qlynk #1 in its Daily Winners for August 24, 2026. The result displayed 71 upvotes for Qlynk.</p>
              <Link href="/blog/qlynk-project-of-the-day-smol-hunt" className="mt-5 inline-flex font-bold text-orange hover:underline">Read the milestone note →</Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-7">Logos and product image</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-8">
              <Image src="/assets/logoBlack.svg" alt="Qlynk AI black logo" width={280} height={100} />
              <a href="/assets/logoBlack.svg" download className="inline-block mt-6 text-black underline">Download black SVG</a>
            </div>
            <div className="rounded-2xl bg-gray-900 border border-white/10 p-8">
              <Image src="/assets/logoWhite.svg" alt="Qlynk AI white logo" width={280} height={100} />
              <a href="/assets/logoWhite.svg" download className="inline-block mt-6 text-white underline">Download white SVG</a>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-white/10 p-6">
              <Image src="/og-image.png" alt="Qlynk AI product social preview" width={1200} height={630} className="rounded-xl" />
              <a href="/og-image.png" download className="inline-block mt-5 underline">Download product image PNG</a>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <h2 className="text-3xl font-bold mb-4">Short product description</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Qlynk turns the information people choose to share into focused AI agents that answer repeated questions through one simple link.</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Company boilerplate</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Qlynk is a no-code platform for turning approved knowledge and clear response rules into a shareable AI agent. People and teams can create personal, business, property, operations, product, support, or custom guides; add facts, FAQs, links, and documents; define what the agent may discuss; publish a Qlynk link; review conversations; and improve the answers over time.</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Media contact</h2>
            <p className="text-lg text-gray-400">A dedicated media address has not yet been confirmed. See the <Link href="/about" className="text-orange hover:underline">About page</Link> for currently published contact details.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
