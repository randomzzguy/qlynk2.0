import Link from 'next/link';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'About Qlynk AI | Make Useful Knowledge Available',
  description: 'Qlynk turns the questions people repeat and the answers they approve into focused, shareable AI agents.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About Qlynk AI', path: '/about' }])} />
      <MarketingHeader />
      <main className="max-w-4xl mx-auto px-6 py-28">
        <header className="mb-16">
          <p className="text-orange font-bold uppercase tracking-[0.18em] text-sm mb-5">About Qlynk AI</p>
          <h1 className="text-5xl md:text-7xl font-black mb-7">Useful answers should not depend on the right person being available</h1>
          <p className="text-xl text-gray-300 leading-relaxed">Qlynk turns the information people choose to share into a focused AI agent that can answer repeated questions through one simple link.</p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-4">Our mission</h2>
            <p className="text-lg text-gray-400 leading-relaxed">Help people and teams make useful knowledge easier to access without giving up control over what an AI knows, what it may discuss, or when a person should step in.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Our vision</h2>
            <p className="text-lg text-gray-400 leading-relaxed">A web where the answer to a routine question is easier to find, while important, uncertain, and sensitive decisions remain with people.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Our story</h2>
            <p className="text-lg text-gray-400 leading-relaxed">Qlynk started with a familiar problem: the same explanation is often repeated in calls, messages, support threads, guest instructions, and team handoffs. We brought the knowledge, response rules, public chat, conversation review, and improvement loop into one no-code platform.</p>
          </section>
          <section>
            <h2 className="text-3xl font-bold mb-4">Contact</h2>
            <p className="text-lg text-gray-400 leading-relaxed">For privacy questions or data requests, email <a className="text-orange hover:underline" href="mailto:info@qlynk.site">info@qlynk.site</a>. Additional company and media contacts will be published here once confirmed.</p>
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
