import AudienceLandingPage from '@/components/AudienceLandingPage';
import { audiencePages } from '@/lib/audience-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-creators';
const page = audiencePages.creators;

export const metadata = createMetadata({
  title: 'AI Agent for Creators and Educators | Qlynk AI',
  description: page.description,
  path,
});

export default function ForCreatorsPage() {
  return <AudienceLandingPage page={page} path={path} />;
}
