import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata, SITE_URL } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk vs Chatbase: AI Agent Platform Comparison',
  description: 'Compare Qlynk and Chatbase across positioning, knowledge sources, scope controls, publishing, actions, analytics, and transparent pricing.',
  path: '/compare/qlynk-vs-chatbase',
  keywords: ['Qlynk vs Chatbase', 'Chatbase alternative', 'AI agent builder comparison'],
});

const rows = [
  ['Primary emphasis', 'Focused personal and business knowledge agents with owner-defined purpose, audience, topics, behavior, and handoff.', 'Customer-service AI agents with lead generation, integrations, channels, analytics, and optional actions.'],
  ['Agent types', 'Personal, Business, Property, Operations, Product, Support, and Custom Guide.', 'Business AI agents configured for support, lead generation, and connected customer workflows.'],
  ['Knowledge inputs', 'Profile context, capabilities, projects, facts, FAQs, links, custom notes, and supported documents.', 'Files, text snippets, websites or sitemaps, custom Q&A, Notion, and—on qualifying configurations—support tickets.'],
  ['Scope and behavior', 'Purpose, audience, allowed and blocked topics, do/don’t rules, uncertainty behavior, tone, response length, and human escalation.', 'Agent instructions plus model, response, security, and action configuration documented by Chatbase.'],
  ['Publishing', 'A hosted qlynk.site link for the agent plus an embeddable website widget.', 'Website embed plus a wider set of integrations and deployment channels documented by Chatbase.'],
  ['External actions', 'Knowledge answers, guidance, links, and a defined human handoff; no claim of general API actions or account transactions.', 'Built-in and custom actions can connect services and APIs, with availability and limits varying by plan.'],
  ['Review', 'Conversation history, visitor feedback, knowledge gaps, and analytics for improving the maintained agent.', 'Conversation activity, topics, sentiment, feedback, contacts, and plan-dependent analytics.'],
  ['Current entry pricing', '14-day trial with everything in Agency; Creator is $9/month and Agency is $19/month. One agent per account.', 'Free plan plus paid Hobby, Standard, Pro, and Enterprise tiers; credits, seats, sources, actions, integrations, and analytics vary by tier.'],
];

export default function QlynkVsChatbasePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Compare', path: '/compare' }, { name: 'Qlynk vs Chatbase', path: '/compare/qlynk-vs-chatbase' }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: 'Qlynk vs Chatbase: AI Agent Platform Comparison', description: metadata.description, datePublished: '2026-07-21', dateModified: '2026-07-21', mainEntityOfPage: `${SITE_URL}/compare/qlynk-vs-chatbase`, author: { '@type': 'Organization', name: 'Qlynk AI' }, publisher: { '@type': 'Organization', name: 'Qlynk AI' } }} />
      <MarketingHeader />
      <main>
        <header className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Independent feature review · July 21, 2026</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Qlynk vs Chatbase</h1>
          <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300">Both products build AI agents from supplied knowledge. Qlynk centers a focused, shareable agent with explicit scope and simple pricing. Chatbase centers a broader customer-service platform with more integrations and external actions.</p>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-orange/40 bg-orange/10 p-8">
              <h2 className="text-2xl font-black">Choose Qlynk when</h2>
              <ul className="mt-6 space-y-4 text-gray-300">
                {['You want one focused agent for a person, business, property, operation, product, support role, or custom guide.', 'A simple public link, website embed, approved knowledge, clear boundaries, and human handoff cover the job.', 'You prefer transparent entry pricing and a 14-day trial containing the full Agency feature set.'].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-orange" size={20} />{item}</li>)}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-black">Choose Chatbase when</h2>
              <ul className="mt-6 space-y-4 text-gray-300">
                {['You need customer-service workflows across a broader integration and channel ecosystem.', 'You need built-in or custom actions that call connected systems and APIs.', 'Your plan and budget fit its required credits, seats, sources, actions, analytics, and integrations.'].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-gray-400" size={20} />{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20">
          <div className="mx-auto max-w-7xl overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="mb-8 text-left text-3xl font-black">Capability comparison</caption>
              <thead><tr className="border-b border-white/20"><th className="p-5 text-gray-400">Area</th><th className="p-5 text-orange">Qlynk</th><th className="p-5">Chatbase</th></tr></thead>
              <tbody>{rows.map(([area, qlynk, chatbase]) => <tr key={area} className="border-b border-white/10 align-top"><th className="p-5 font-bold">{area}</th><td className="p-5 leading-relaxed text-gray-300">{qlynk}</td><td className="p-5 leading-relaxed text-gray-400">{chatbase}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="text-3xl font-black">Methodology and sources</h2>
            <p className="mt-5 leading-relaxed text-gray-400">Qlynk details were checked against the current application, plan configuration, and product pages. Chatbase details were checked against its official documentation and pricing page on July 21, 2026. We avoided scoring features that cannot be compared fairly and did not treat a missing mention as proof that a feature does not exist.</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
              <a href="https://www.chatbase.co/docs/user-guides/quick-start/introduction" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange hover:underline">Chatbase overview <ExternalLink size={14} /></a>
              <a href="https://www.chatbase.co/docs/user-guides/chatbot/data-sources" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange hover:underline">Data sources <ExternalLink size={14} /></a>
              <a href="https://www.chatbase.co/docs/user-guides/chatbot/actions/actions-overview" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange hover:underline">Actions <ExternalLink size={14} /></a>
              <a href="https://www.chatbase.co/pricing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange hover:underline">Pricing <ExternalLink size={14} /></a>
            </div>
          </div>
          <aside className="rounded-3xl border border-white/10 p-8">
            <h2 className="text-2xl font-black">Run your own test</h2>
            <p className="mt-4 leading-relaxed text-gray-400">Use the same real sources, expected questions, missing-answer cases, sensitive requests, and pricing assumptions on both platforms.</p>
            <Link href="/blog/best-ai-agent-platforms" className="mt-6 inline-flex items-center gap-2 font-bold text-orange">Open the evaluation framework <ArrowRight size={17} /></Link>
          </aside>
        </section>

        <section className="px-6 pb-24 text-center">
          <div className="mx-auto max-w-5xl rounded-3xl bg-orange p-10 md:p-14">
            <h2 className="text-3xl font-black md:text-5xl">Build the focused agent first</h2>
            <p className="mx-auto mt-4 max-w-2xl text-orange-50">Try every Agency feature for 14 days, then choose the plan that fits.</p>
            <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-orange-700">Start Building Free <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
