import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

export default function ResourceArticle({ article, slug }) {
  const path = `/blog/${slug}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        mainEntityOfPage: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: 'Qlynk AI' },
        publisher: { '@type': 'Organization', name: 'Qlynk AI' },
      }} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Resources', path: '/blog' },
        { name: article.shortTitle, path },
      ])} />
      <MarketingHeader />

      <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-gray-500">
          <Link href="/blog" className="transition-colors hover:text-white">Resources</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>{article.shortTitle}</span>
        </nav>

        <header className="mb-16 border-b border-white/10 pb-14">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-orange">{article.category}</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">{article.title}</h1>
          <p className="mt-7 text-xl leading-relaxed text-gray-300">{article.description}</p>
          <p className="mt-5 text-sm text-gray-500">{article.readTime}</p>
        </header>

        <article className="space-y-14">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-5 text-3xl font-black tracking-tight">{section.heading}</h2>
              <div className="space-y-5 text-lg leading-relaxed text-gray-300">
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.points && (
                  <ul className="space-y-4">
                    {section.points.map(([title, text]) => (
                      <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <strong className="block text-white">{title}</strong>
                        <span className="mt-2 block text-gray-400">{text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>

        <section className="mt-20 rounded-3xl border border-orange/30 bg-orange/10 p-9 text-center md:p-12">
          <h2 className="text-3xl font-black">Start with one question you are tired of repeating</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">Add the answer, define the limits, test the response, and build from there.</p>
          <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange px-7 py-4 font-bold text-white transition-colors hover:bg-[#c14f22]">
            Create your agent <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
