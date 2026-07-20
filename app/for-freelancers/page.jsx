import AudienceLandingPage from '@/components/AudienceLandingPage';
import { audiencePages } from '@/lib/audience-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-freelancers';
const page = audiencePages.freelancers;

export const metadata = createMetadata({
  title: 'AI Agent for Freelancers and Consultants | Qlynk AI',
  description: page.description,
  path,
});

export default function ForFreelancersPage() {
  return <AudienceLandingPage page={page} path={path} />;
}
