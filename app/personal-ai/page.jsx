import MarketingLandingPage from '@/components/MarketingLandingPage';
import { marketingPages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

const path = '/personal-ai';
const page = marketingPages['personal-ai'];

export const metadata = createMetadata({ title: 'Personal AI Agent Built Around You | Qlynk AI', description: page.description, path });

export default function PersonalAIPage() {
  return <MarketingLandingPage page={page} path={path} />;
}
