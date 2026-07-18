import MarketingLandingPage from '@/components/MarketingLandingPage';
import { marketingPages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

const path = '/for-business';
const page = marketingPages['for-business'];

export const metadata = createMetadata({ title: 'Focused AI Agents for Business | Qlynk AI', description: page.description, path });

export default function ForBusinessPage() {
  return <MarketingLandingPage page={page} path={path} />;
}
