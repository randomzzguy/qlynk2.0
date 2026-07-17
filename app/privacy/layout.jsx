import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Privacy Policy | Qlynk AI',
  description: 'Read how Qlynk AI collects, uses, protects, retains, and deletes account, agent, knowledge, document, and conversation data.',
  path: '/privacy',
});

export default function PrivacyLayout({ children }) {
  return children;
}
