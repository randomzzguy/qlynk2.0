import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Terms of Service | Qlynk AI',
  description: 'Read the terms that govern use of the Qlynk AI personal AI agent platform.',
  path: '/terms',
});

export default function TermsLayout({ children }) {
  return children;
}
