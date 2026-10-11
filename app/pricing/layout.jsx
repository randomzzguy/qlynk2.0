import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI Pricing | Focused AI Agent Plans',
  description: 'Compare Qlynk AI plans for personal, business, property, operations, product, support, and custom AI agents. Creator is free forever. Agency is an optional paid upgrade.',
  path: '/pricing',
});

export default function PricingLayout({ children }) {
  return children;
}
