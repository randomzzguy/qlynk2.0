import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Eye, Rocket, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata, SITE_URL } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk Documentation | Build and Maintain an AI Agent',
  description: 'Start, configure, teach, test, publish, and improve a Qlynk Agent with current product guidance and practical trust controls.',
  path: '/docs',
});

const groups = [
  { icon: Rocket, title: 'Start and choose the job', description: 'Begin with one audience and one repeated question before adding knowledge.', links: [['Create an AI agent', '/blog/how-to-create-ai-clone'], ['Explore agent solutions', '/solutions'], ['Plans and 14-day trial', '/pricing']] },
  { icon: ShieldCheck, title: 'Configure scope and behavior', description: 'Define purpose, audience, allowed and blocked topics, uncertainty, tone, and handoff.', links: [['Scope and controls', '/features/security'], ['Custom AI agents', '/solutions/custom-ai-agents'], ['AI hallucinations and controls', '/blog/ai-hallucinations-approved-knowledge']] },
  { icon: Brain, title: 'Add approved knowledge', description: 'Use reviewed facts, FAQs, links, notes, and supported documents appropriate for the audience.', links: [['Knowledge base', '/features/knowledge-base'], ['Knowledge-based AI', '/solutions/knowledge-based-ai'], ['Documentation best practices', '/blog/ai-documentation-best-practices']] },
  { icon: Eye, title: 'Test and improve', description: 'Test expected, uncertain, sensitive, and out-of-scope questions, then review real knowledge gaps.', links: [['Analytics and review', '/features/analytics'], ['RAG explained', '/blog/rag-explained'], ['AI knowledge management', '/blog/ai-knowledge-management']] },
  { icon: BookOpen, title: 'Publish and share', description: 'Use the hosted Qlynk link or add the agent to a website, then keep ownership and sources current.', links: [['Sharing and embed', '/features/integrations'], ['AI agent builder', '/solutions/ai-agent-builder'], ['Customer support guide', '/blog/how-to-build-customer-support-ai']] },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Documentation', path: '/docs' }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Qlynk documentation', description: metadata.description, url: `${SITE_URL}/docs`, author: { '@type': 'Organization', name: 'Qlynk AI' } }} />
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <header className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Qlynk documentation</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Build a useful agent you can maintain</h1>
          <p className="mt-7 text-xl leading-relaxed text-gray-300">The practical path from one repeated question to approved knowledge, tested limits, a public experience, and an ongoing review loop.</p>
        </header>
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {groups.map(({ icon: Icon, title, description, links }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <Icon className="text-orange" size={30} />
              <h2 className="mt-5 text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-relaxed text-gray-400">{description}</p>
              <ul className="mt-6 space-y-3">{links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex items-center gap-2 font-bold text-orange hover:underline">{label} <ArrowRight size={15} /></Link></li>)}</ul>
            </div>
          ))}
        </section>
        <section className="mt-20 rounded-3xl border border-orange/30 bg-orange/10 p-10 text-center">
          <h2 className="text-3xl font-black">Need the product answer?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">See current features, plan limits, billing details, and safety guidance in the product FAQ.</p>
          <Link href="/faq" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange px-7 py-4 font-bold">Open the FAQ <ArrowRight size={17} /></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
