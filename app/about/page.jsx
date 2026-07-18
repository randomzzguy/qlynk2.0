import Link from 'next/link';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'About Qlynk AI | Our Mission and Story',
  description: 'Learn why Qlynk AI is building focused, owner-governed AI agents for people, businesses, places, operations, products, and support teams.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About Qlynk AI', path: '/about' }])} />
      <main className="max-w-4xl mx-auto px-6 py-28">
        <header className="mb-16">
          <p className="text-orange font-bold uppercase tracking-[0.18em] text-sm mb-5">About Qlynk AI</p>
          <h1 className="text-5xl md:text-7xl font-black mb-7">Make useful knowledge available at the moment it is needed</h1>
          <p className="text-xl text-gray-300 leading-relaxed">Qlynk is a no-code platform for turning approved knowledge and clear operating rules into a focused AI agent people can use through a shareable public link.</p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-4">Our mission</h2>
            <p className="text-lg text-gray-400 leading-relaxed">Give people a practical, controlled way to build an AI guide for a person, business, place, operation, product, support workflow, or custom purpose.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Our vision</h2>
            <p className="text-lg text-gray-400 leading-relaxed">A web where useful knowledge can be explored conversationally without turning every agent into a general assistant or requiring every owner to build an AI product from scratch.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Our story</h2>
            <p className="text-lg text-gray-400 leading-relaxed">Qlynk started with a simple question: what if the knowledge people repeatedly need could remain useful when its owner is unavailable? The product brings role selection, knowledge, rules, publishing, conversations, and insights into one platform.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Contact</h2>
            <p className="text-lg text-gray-400 leading-relaxed">For privacy questions or data requests, email <a className="text-orange hover:underline" href="mailto:privacy@qlynk.site">privacy@qlynk.site</a>. Additional company and media contacts will be published here once confirmed.</p>
          </section>
        </div>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link href="/ai-agent" className="bg-orange rounded-xl px-7 py-4 font-bold">Explore the Platform</Link>
          <Link href="/press" className="border border-white/20 rounded-xl px-7 py-4 font-bold">View the Press Kit</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
