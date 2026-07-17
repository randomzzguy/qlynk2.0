import { notFound } from 'next/navigation';
import FeatureLandingPage from '@/components/FeatureLandingPage';
import { featurePages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return Object.keys(featurePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const feature = featurePages[slug];
  if (!feature) return {};
  return createMetadata({
    title: `${feature.title} | Qlynk AI`,
    description: feature.description,
    path: `/features/${slug}`,
  });
}

export default async function FeaturePage({ params }) {
  const { slug } = await params;
  const feature = featurePages[slug];
  if (!feature) notFound();
  return <FeatureLandingPage feature={feature} slug={slug} />;
}
