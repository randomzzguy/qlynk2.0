import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Download,
  ExternalLink,
  FileCheck2,
  MessagesSquare,
  PackageCheck,
  ShieldCheck,
  TestTube2,
  UserRoundCheck,
  Wrench,
} from 'lucide-react';
import Footer from '@/components/Footer';
import AgentBuilderInstallTabs from '@/components/AgentBuilderInstallTabs';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, createMetadata, SITE_URL } from '@/lib/seo';

const path = '/agent-builder';
const version = '1.1.1';
const downloadPath = `/downloads/qlynk-agent-builder-skill-v${version}.zip`;
const githubUrl = 'https://github.com/randomzzguy/qlynk-agent-builder';
const codexPluginUrl = 'https://chatgpt.com/plugins/plugins_6a7a8eef28608191869f04ead95cd5b2';

export const metadata = createMetadata({
  title: 'Official Qlynk Agent Builder Plugin for Codex',
  description: 'Install the official Qlynk Agent Builder plugin for Codex. Interview clients, configure accurate Qlynk Agents, test their answers, and hand off a client-owned subscription. Claude directory review is pending.',
  path,
  keywords: ['Qlynk Agent Builder', 'official Codex plugin', 'AI agent freelancer', 'AI chatbot setup service', 'build AI agents for clients'],
});

const workflow = [
  ['Find a client', 'Choose a business with repeated customer, sales, support, or onboarding questions.', BriefcaseBusiness],
  ['Run five questions', 'The Quick interview extracts the audience, job, knowledge, limits, voice, and next step.', MessagesSquare],
  ['Build the agent', 'Turn approved answers and sources into Qlynk’s identity, rules, facts, FAQs, links, and documents.', Bot],
  ['Test the boundaries', 'Check normal, missing, sensitive, out-of-scope, and prompt-injection questions before launch.', TestTube2],
  ['Hand it to the client', 'The client approves the result and keeps control of the account, subscription, recovery, and sources.', UserRoundCheck],
];

const deliverables = [
  ['Client interview', 'Quick and Advanced discovery paths that avoid repeating questions.', MessagesSquare],
  ['Qlynk Build Pack', 'Copy-ready configuration mapped to Qlynk’s current fields and limits.', PackageCheck],
  ['Approved knowledge', 'Structured facts, FAQs, source links, and document recommendations.', FileCheck2],
  ['Scope and safety', 'Blocked topics, uncertainty behavior, and actionable human escalation.', ShieldCheck],
  ['Launch testing', 'A minimum 12-question test covering real requests and difficult edge cases.', ClipboardCheck],
  ['Website handoff', 'Public-page, access, lead-capture, and widget-installation decisions.', Code2],
];

const serviceItems = [
  'Client discovery and source review',
  'Agent identity, purpose, rules, and tone',
  'Knowledge-base formatting and entry',
  'Facts, FAQs, documents, and public links',
  'Accuracy, boundary, and handoff testing',
  'Website widget setup and client training',
];

const freelancerGuides = [
  ['How to Sell AI Agents to Small Businesses', 'Find a narrow business problem, demonstrate it safely, and sell a complete implementation rather than vague automation.', 'how-to-sell-ai-agents-to-small-businesses'],
  ['How Much to Charge for AI Agent Setup', 'Price discovery, knowledge preparation, configuration, testing, installation, and ongoing maintenance as real project work.', 'how-much-to-charge-for-ai-agent-setup'],
  ['AI Agent Client Discovery Questionnaire', 'Use simple questions to uncover the audience, job, approved knowledge, limits, voice, escalation path, and launch criteria.', 'ai-agent-client-discovery-questionnaire'],
  ['AI Agent Testing Checklist', 'Test routine answers, missing knowledge, boundaries, sensitive requests, prompt attacks, links, and human handoff before launch.', 'ai-agent-testing-checklist'],
  ['How to Train an AI Agent on Company Documents', 'Turn company material into a current, approved, searchable knowledge set instead of uploading an unreviewed document dump.', 'how-to-train-ai-agent-on-company-documents'],
];

const faqs = [
  ['Is the Qlynk Agent Builder free?', 'Yes. The downloadable workflow is free. A live Qlynk Agent still requires the client’s own trial or paid Qlynk subscription.'],
  ['Can freelancers charge for using it?', 'Yes. Freelancers can charge for discovery, configuration, knowledge preparation, testing, website installation, training, and ongoing maintenance.'],
  ['Who should own the Qlynk account?', 'The client should control the account email, recovery, billing, public username, and source files from the beginning.'],
  ['Does it guarantee every answer is correct?', 'No. It reduces avoidable errors through approved sources, explicit boundaries, client review, and structured testing. Generated answers still require responsible oversight.'],
  ['Does the skill publish automatically?', 'It can prepare and enter approved configuration when an authorized browser session is available. Publishing, billing changes, and live website installation still require confirmation.'],
  ['Is it an official Codex plugin?', 'Yes. Qlynk Agent Builder version 1.1.1 is live in the official Codex plugin directory and can be installed directly from its ChatGPT listing.'],
  ['Does it work with Claude?', 'Yes. The Claude Code-compatible package is available from the Qlynk GitHub marketplace. Its Claude community directory listing is still under review.'],
  ['What can the agent represent?', 'Qlynk currently supports personal, business, property, operations, product, support, and custom focused agents.'],
];

export default function AgentBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Qlynk Agent Builder', path },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Qlynk Agent Builder',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Codex and Claude Code supported environments',
        description: metadata.description,
        url: `${SITE_URL}${path}`,
        downloadUrl: `${SITE_URL}${downloadPath}`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@type': 'Organization', name: 'Qlynk AI', url: SITE_URL },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      }} />

      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-orange/15 blur-[150px]" />
            <div className="absolute right-[-8rem] top-48 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                <CheckCircle2 size={16} aria-hidden="true" /> Official Codex plugin · Live
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Build Qlynk Agents for clients. <span className="text-orange">Charge for the setup.</span>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-relaxed text-gray-300 sm:text-xl">
                The Qlynk Agent Builder helps you interview a business, organize its approved knowledge, configure the agent, test difficult questions, and deliver a professional client-owned handoff.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={codexPluginUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-7 py-4 font-black text-white transition-colors hover:bg-[#c14f22]">
                  Install the Codex plugin <ExternalLink size={17} aria-hidden="true" />
                </a>
                <a href={downloadPath} download className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-black text-white transition hover:border-orange/60 hover:bg-white/10">
                  <Download size={19} aria-hidden="true" /> Download the free skill
                </a>
                <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:border-orange/60 hover:bg-white/10">
                  View on GitHub <ExternalLink size={17} aria-hidden="true" />
                </a>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">Official Codex plugin · Claude community directory review pending · Free workflow download · Client subscription sold separately</p>
            </div>

            <div className="relative">
              <div className="absolute inset-8 rounded-full bg-orange/20 blur-[90px]" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#11131a]/95 p-5 shadow-2xl shadow-black/40 sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange text-white"><Bot size={22} /></div>
                    <div><p className="font-black">Qlynk Agent Builder</p><p className="text-xs text-gray-500">Quick client discovery</p></div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">5 questions</span>
                </div>
                <div className="space-y-4 py-6">
                  <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-orange/20 bg-orange/10 p-4 text-sm leading-relaxed text-gray-200">
                    Who should use this agent, what should it help them do, and what five questions do they ask you most often?
                  </div>
                  <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-900">
                    Homeowners who need AC repairs, pricing guidance, service-area details, or a booking link.
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {['Purpose & audience', 'Facts & FAQs', 'Rules & handoff', '12 launch tests'].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs font-bold text-gray-300">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-400" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Output</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">A verified Qlynk Build Pack ready for client approval, implementation, testing, and handoff.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-2">
            <a href={codexPluginUrl} target="_blank" rel="noreferrer" className="group rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6 transition hover:border-emerald-300/50 hover:bg-emerald-400/[0.09]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Codex status</p>
                  <h2 className="mt-2 text-xl font-black">Official plugin — available now</h2>
                </div>
                <ExternalLink size={20} className="shrink-0 text-emerald-300 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <p className="mt-3 leading-relaxed text-gray-400">Open the verified Qlynk Agent Builder listing and select <span className="font-bold text-gray-200">Install plugin</span>.</p>
            </a>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Claude status</p>
              <h2 className="mt-2 text-xl font-black">Compatible package available — directory review pending</h2>
              <p className="mt-3 leading-relaxed text-gray-400">The Claude Code package can already be installed from GitHub. Its Claude community directory submission is still under review.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">The freelancer workflow</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">From first conversation to client handoff</h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-400">Use one repeatable process instead of improvising a different prompt, questionnaire, and quality check for every company.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {workflow.map(([title, description, Icon], index) => (
              <article key={title} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10 text-orange"><Icon size={20} /></div>
                  <span className="text-xs font-black text-gray-600">0{index + 1}</span>
                </div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Inside the free skill</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">The parts clients actually pay you to handle</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {deliverables.map(([title, description, Icon]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-gray-950 p-7">
                  <Icon size={25} className="text-orange" />
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-3 leading-relaxed text-gray-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="rounded-[2rem] border border-orange/25 bg-gradient-to-br from-orange/15 to-white/[0.025] p-8 sm:p-10">
            <BadgeDollarSign size={34} className="text-orange" />
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Sell a complete setup service</h2>
            <p className="mt-4 leading-relaxed text-gray-300">Charge your own project fee for the implementation work. The client pays Qlynk separately and keeps control of the continuing subscription.</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {serviceItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300"><Check size={17} className="mt-0.5 shrink-0 text-emerald-400" /> {item}</li>
              ))}
            </ul>
            <p className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-gray-400">Optional recurring work can include approved content updates, conversation review, knowledge-gap resolution, and retesting after business changes.</p>
          </div>

          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/[0.045] p-8 sm:p-10">
            <UserRoundCheck size={34} className="text-emerald-300" />
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Keep ownership clean from day one</h2>
            <p className="mt-4 leading-relaxed text-gray-300">The client creates the Qlynk account with a company-controlled email. You configure the agent through an authorized session; they approve the content, choose the plan, and enter their own billing details.</p>
            <div className="mt-7 space-y-3">
              {['Client controls email, recovery, username, and billing', 'Freelancer never collects passwords, cards, or verification codes', 'Facts and public contact details require client approval', 'Publishing and live website installation require confirmation'].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300"><ShieldCheck size={18} className="shrink-0 text-emerald-300" /> {item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Freelancer playbook</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Learn the business around the build</h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-400">Use these practical guides to find clients, scope the work, prepare reliable knowledge, test the finished agent, and price your service.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {freelancerGuides.map(([title, description, slug]) => (
                <Link key={slug} href={`/blog/${slug}`} className="group rounded-2xl border border-white/10 bg-gray-950 p-7 transition hover:border-orange/40">
                  <h3 className="text-xl font-black transition group-hover:text-orange">{title}</h3>
                  <p className="mt-3 leading-relaxed text-gray-400">{description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-orange">Read the guide <ArrowRight size={16} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0b0d12]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Install and start</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Choose the quickest route</h2>
            </div>
            <AgentBuilderInstallTabs downloadPath={downloadPath} githubUrl={githubUrl} codexPluginUrl={codexPluginUrl} version={version} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange">Questions</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Before you offer it to a client</h2>
          </div>
          <div className="mt-12 space-y-4">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <summary className="cursor-pointer list-none pr-8 text-lg font-black">{question}</summary>
                <p className="mt-4 max-w-4xl leading-relaxed text-gray-400">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] border border-orange/30 bg-gradient-to-br from-orange/20 via-orange/10 to-cyan-500/10 p-9 text-center sm:p-14">
            <Wrench size={34} className="mx-auto text-orange" />
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Build the first agent for your own service, then show clients the result.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">Use the free workflow to prepare the agent. Start a Qlynk trial when you are ready to configure, test, and demonstrate the live experience.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={downloadPath} download className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-black text-gray-950 transition hover:bg-gray-200"><Download size={18} /> Get the free skill</a>
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-7 py-4 font-black text-white transition hover:bg-[#c14f22]">Start Qlynk free <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
