import MarketingLandingPage from '@/components/MarketingLandingPage';
import { marketingPages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

const path = '/ai-agent';
const page = marketingPages['ai-agent'];

export const metadata = createMetadata({ title: 'No-Code AI Agent Platform | Qlynk AI', description: page.description, path });

export default function AIAgentPage() {
  return <MarketingLandingPage page={page} path={path} />;
}
