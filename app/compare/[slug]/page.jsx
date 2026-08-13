import { notFound } from 'next/navigation';
import PlatformComparisonPage from '@/components/PlatformComparisonPage';
import { comparisonPages } from '@/lib/comparison-pages';
import { createMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(comparisonPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const comparison = comparisonPages[slug];
  if (!comparison) return {};

  return createMetadata({
    title: comparison.title,
    description: comparison.description,
    path: `/compare/${slug}`,
    keywords: comparison.keywords,
  });
}

export default async function ComparisonPage({ params }) {
  const { slug } = await params;
  const comparison = comparisonPages[slug];
  if (!comparison) notFound();

  return <PlatformComparisonPage comparison={comparison} slug={slug} />;
}
