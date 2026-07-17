import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI Pricing | Personal AI Agent Plans',
  description: 'Compare Qlynk AI plans for creators, professionals, agencies, and businesses. Start your personal AI agent with a 14-day free trial.',
  path: '/pricing',
});

export default function PricingLayout({ children }) {
  return children;
}
