import Link from 'next/link';

// Compatibility notice for accounts that have not yet received the migration.
export default function TrialChoiceManager({ subscription }) {
  if (subscription?.tier?.toLowerCase() !== 'trial') return null;
  return (
    <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <h3 className="font-bold text-white">Creator is now free</h3>
      <p className="mt-2 text-sm text-gray-300">Your agent can continue on Creator with 5,000 messages per month. There is no expiry and no card required.</p>
      <Link href="/pricing" className="mt-3 inline-block text-sm font-semibold text-orange">Compare optional Agency upgrades →</Link>
    </div>
  );
}
