import { notFound } from 'next/navigation';
import SolutionLandingPage from '@/components/SolutionLandingPage';
import { createMetadata } from '@/lib/seo';
import { solutionPages } from '@/lib/solution-pages';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(solutionPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = solutionPages[slug];
  if (!page) return {};
  return createMetadata({ title: `${page.title} | Qlynk AI`, description: page.description, path: `/solutions/${slug}`, keywords: page.keywords });
}

export default async function SolutionPage({ params }) {
  const { slug } = await params;
  const page = solutionPages[slug];
  if (!page) notFound();
  return <SolutionLandingPage page={page} />;
}
