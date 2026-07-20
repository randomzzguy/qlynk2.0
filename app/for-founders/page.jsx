import AudienceLandingPage from '@/components/AudienceLandingPage';
import { audiencePages } from '@/lib/audience-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-founders';
const page = audiencePages.founders;

export const metadata = createMetadata({
  title: 'AI Agent for Founders and Startups | Qlynk AI',
  description: page.description,
  path,
});

export default function ForFoundersPage() {
  return <AudienceLandingPage page={page} path={path} />;
}
