import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI Press Kit | Logos and Product Information',
  description: 'Download Qlynk AI brand assets and find the official product description and company boilerplate.',
  path: '/press',
});

export default function PressPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Press Kit', path: '/press' }])} />
      <main className="max-w-5xl mx-auto px-6 py-28">
        <header className="max-w-3xl mb-16">
          <p className="text-orange font-bold uppercase tracking-[0.18em] text-sm mb-5">Press Kit</p>
          <h1 className="text-5xl md:text-7xl font-black mb-7">Qlynk AI brand and product resources</h1>
          <p className="text-xl text-gray-300">Approved assets and concise descriptions for articles, directories, and other coverage.</p>
        </header>

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
            <p className="text-lg text-gray-300 leading-relaxed">Qlynk AI helps professionals, creators, founders, and businesses create a personal AI agent trained on the knowledge they choose to provide.</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Company boilerplate</h2>
            <p className="text-lg text-gray-300 leading-relaxed">Qlynk is a personal AI agent platform for building, training, publishing, and improving an AI-powered online representative. Users can add professional context, share a personal Qlynk link, and understand visitor interests through conversation insights.</p>
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
