import { redirect } from 'next/navigation';

export default function LegacyCreatePage() {
  redirect('/dashboard/agent?section=general');
}
