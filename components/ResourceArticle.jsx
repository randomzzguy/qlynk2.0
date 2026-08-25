import Link from 'next/link';
import { ArrowRight, Download, ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import MarketingHeader from '@/components/MarketingHeader';
import { breadcrumbSchema, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';
import { solutionPages } from '@/lib/solution-pages';
import { authorityArticles } from '@/lib/authority-articles';

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
        image: DEFAULT_OG_IMAGE,
        url: `${SITE_URL}${path}`,
        datePublished: article.datePublished || '2026-07-21',
        dateModified: article.dateModified || '2026-07-21',
        ...(article.sources?.length > 0 ? {
          citation: article.sources.map(([, href]) => href.startsWith('http') ? href : `${SITE_URL}${href}`),
        } : {}),
      }} />
      {article.faqs && <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: article.faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
      }} />}
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
          <p className="mt-5 text-sm text-gray-500">
            Published by <Link href="/about" className="underline decoration-white/20 underline-offset-4 hover:text-white">Qlynk AI</Link>
            {' · '}{article.readTime}{' · '}Updated {article.dateModified || article.datePublished || '2026-07-21'}
          </p>
        </header>

        {article.quickAnswer && (
          <section aria-labelledby="in-brief-heading" className="mb-14 rounded-3xl border border-orange/30 bg-orange/10 p-7 md:p-9">
            <p id="in-brief-heading" className="text-sm font-black uppercase tracking-[0.18em] text-orange">In brief</p>
            <p className="mt-4 text-lg leading-relaxed text-gray-200">{article.quickAnswer}</p>
          </section>
        )}

        {article.download && (
          <section aria-labelledby="download-heading" className="mb-14 rounded-3xl border border-white/10 bg-white/5 p-7 md:flex md:items-center md:justify-between md:gap-8 md:p-9">
            <div>
              <h2 id="download-heading" className="text-2xl font-black">Free working template</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-gray-400">{article.download.description}</p>
            </div>
            <a
              href={article.download.href}
              download={article.download.filename}
              className="mt-6 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-gray-950 transition-colors hover:bg-gray-200 md:mt-0"
            >
              <Download size={18} aria-hidden="true" /> {article.download.label}
            </a>
          </section>
        )}

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

        {article.faqs && (
          <section className="mt-20 border-t border-white/10 pt-14">
            <h2 className="text-3xl font-black tracking-tight">Frequently asked questions</h2>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {article.faqs.map(([question, answer]) => (
                <details key={question} className="py-6">
                  <summary className="cursor-pointer list-none text-lg font-bold">{question}</summary>
                  <p className="mt-4 leading-relaxed text-gray-400">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {article.sources?.length > 0 && (
          <section className="mt-16 border-t border-white/10 pt-12" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="text-2xl font-black">Sources and further reading</h2>
            <p className="mt-3 leading-relaxed text-gray-500">Primary guidance and documentation used to verify material claims on this page.</p>
            <ul className="mt-6 space-y-3">
              {article.sources.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex items-center gap-2 font-semibold text-gray-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-orange"
                  >
                    {label}{href.startsWith('http') && <ExternalLink size={15} aria-hidden="true" />}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.relatedSolutions?.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black">Related Qlynk solutions</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {article.relatedSolutions.filter((relatedSlug) => solutionPages[relatedSlug]).map((relatedSlug) => {
                const related = solutionPages[relatedSlug];
                return <Link key={relatedSlug} href={`/solutions/${relatedSlug}`} className="rounded-2xl border border-white/10 p-5 hover:border-orange/40"><strong>{related.shortTitle}</strong><span className="mt-2 block text-sm leading-relaxed text-gray-500">{related.description}</span></Link>;
              })}
            </div>
          </section>
        )}

        {article.relatedArticles?.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black">Related Qlynk resources</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {article.relatedArticles.filter((relatedSlug) => authorityArticles[relatedSlug]).map((relatedSlug) => {
                const related = authorityArticles[relatedSlug];
                return <Link key={relatedSlug} href={`/blog/${relatedSlug}`} className="rounded-2xl border border-white/10 p-5 transition-colors hover:border-orange/40"><strong>{related.shortTitle}</strong><span className="mt-2 block text-sm leading-relaxed text-gray-500">{related.description}</span></Link>;
              })}
            </div>
          </section>
        )}

        <section className="mt-20 rounded-3xl border border-orange/30 bg-orange/10 p-9 text-center md:p-12">
          <h2 className="text-3xl font-black">{article.ctaTitle || 'Turn your approved knowledge into a trusted AI agent'}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">{article.ctaText || 'Add the answer, define the limits, test the response, and build from there.'}</p>
          <Link href={article.ctaHref || '/auth/signup'} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange px-7 py-4 font-bold text-white transition-colors hover:bg-[#c14f22]">
            {article.ctaLabel || 'Start Free'} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
