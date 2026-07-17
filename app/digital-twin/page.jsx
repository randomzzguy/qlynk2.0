import MarketingLandingPage from '@/components/MarketingLandingPage';
import { marketingPages } from '@/lib/marketing-pages';
import { createMetadata } from '@/lib/seo';

const path = '/digital-twin';
const page = marketingPages['digital-twin'];

export const metadata = createMetadata({ title: 'Professional Digital Twin Platform | Qlynk AI', description: page.description, path });

export default function DigitalTwinPage() {
  return <MarketingLandingPage page={page} path={path} />;
}
