import AudienceLandingPage from '@/components/AudienceLandingPage';
import { audiencePages } from '@/lib/audience-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-job-seekers';
const page = audiencePages['job-seekers'];

export const metadata = createMetadata({
  title: 'Personal AI Agent for Job Seekers | Qlynk AI',
  description: page.description,
  path,
});

export default function ForJobSeekersPage() {
  return <AudienceLandingPage page={page} path={path} />;
}
