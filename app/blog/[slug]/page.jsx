import { notFound } from 'next/navigation';
import ResourceArticle from '@/components/ResourceArticle';
import { authorityArticles } from '@/lib/authority-articles';
import { createMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(authorityArticles).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = authorityArticles[slug];
  if (!article) return {};
  return createMetadata({ title: `${article.title} | Qlynk AI`, description: article.description, path: `/blog/${slug}`, type: 'article' });
}

export default async function AuthorityArticlePage({ params }) {
  const { slug } = await params;
  const article = authorityArticles[slug];
  if (!article) notFound();
  return <ResourceArticle article={article} slug={slug} />;
}
