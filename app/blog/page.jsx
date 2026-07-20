import Link from 'next/link';
import { ArrowRight, BookOpen, HelpCircle, Lightbulb, MessagesSquare } from 'lucide-react';
import Footer from '@/components/Footer';
import MarketingHeader from '@/components/MarketingHeader';
import { resourceArticles } from '@/lib/resource-articles';
import { authorityArticles } from '@/lib/authority-articles';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk Resources | Build a Useful, Focused AI Agent',
  description: 'Practical guides to defining an AI agent’s job, choosing its knowledge, setting boundaries, testing answers, and improving it over time.',
  path: '/blog',
});

const icons = {
  'what-is-an-ai-clone': Lightbulb,
  'how-to-create-ai-clone': BookOpen,
  'ai-clone-vs-chatbot': HelpCircle,
  'ai-clone-vs-chatgpt': MessagesSquare,
};

export default function ResourcesPage() {
  const allArticles = { ...authorityArticles, ...resourceArticles };
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <MarketingHeader />
      <main>
        <header className="relative overflow-hidden border-b border-white/10 px-6 py-24 text-center md:py-32">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-orange/10 blur-[140px]" />
          <div className="relative mx-auto max-w-4xl">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-orange">Qlynk resources</p>
            <h1 className="text-5xl font-black tracking-tight md:text-7xl">Build an agent people can actually rely on</h1>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-gray-300">Practical guidance for choosing the job, adding approved answers, setting limits, testing the edges, and improving from real questions.</p>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-2 md:py-24">
          {Object.entries(allArticles).map(([slug, article]) => {
            const Icon = icons[slug] || BookOpen;
            return (
              <Link key={slug} href={`/blog/${slug}`} className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:-translate-y-1 hover:border-orange/40 hover:bg-white/[0.07]">
                <div className="mb-8 flex items-center justify-between">
                  <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange">{article.category}</span>
                  <Icon className="text-orange" size={26} />
                </div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">{article.title}</h2>
                <p className="mt-4 leading-relaxed text-gray-400">{article.description}</p>
                <div className="mt-8 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{article.readTime}</span>
                  <span className="flex items-center gap-2 font-bold text-white transition-colors group-hover:text-orange">Read guide <ArrowRight size={16} /></span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-[#f46530] to-[#c14f22] p-10 md:p-14">
            <h2 className="text-3xl font-black md:text-4xl">Ready to turn your answers into an agent?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-orange-50">Start with one repeated question, add the answer you approve, and define when a person should step in.</p>
            <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-orange-700">Start free <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
