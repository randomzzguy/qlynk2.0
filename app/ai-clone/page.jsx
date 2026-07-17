import MarketingLandingPage from '@/components/MarketingLandingPage';
import { marketingPages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

const path = '/ai-clone';
const page = marketingPages['ai-clone'];

export const metadata = createMetadata({ title: 'AI Clone Platform | Create Your AI Clone | Qlynk AI', description: page.description, path });

export default function AIClonePage() {
  return <MarketingLandingPage page={page} path={path} />;
}
