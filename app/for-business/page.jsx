import AudienceLandingPage from '@/components/AudienceLandingPage';
import { audiencePages } from '@/lib/audience-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-business';
const page = audiencePages.business;

export const metadata = createMetadata({
  title: 'Focused AI Agent for Business Questions | Qlynk AI',
  description: page.description,
  path,
});

export default function ForBusinessPage() {
  return <AudienceLandingPage page={page} path={path} />;
}
