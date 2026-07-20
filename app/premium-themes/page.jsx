import { redirect } from 'next/navigation';

export default function LegacyPremiumThemesPage() {
  redirect('/dashboard/agent?section=visual');
}
