'use client';

import { useState } from 'react';
import { PRODUCT_PACK_KEY } from '@/lib/qlynk-product-update';

export default function QlynkProductFactsUpdate({ onUpdated }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function review() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/agent/product-facts', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPreview(data);
    } catch (error) { setMessage(error.message || 'Unable to review product facts.'); }
    finally { setLoading(false); }
  }

  async function update(action) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/agent/product-facts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, packKey: PRODUCT_PACK_KEY, reviewToken: preview?.reviewToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPreview(null);
      setMessage(action === 'apply' ? 'Product facts and instructions updated. Old sources are archived and can be restored with Undo.' : 'Previous sources and instructions restored. The new fact pack is archived.');
      await onUpdated();
    } catch (error) { setMessage(error.message || 'Unable to update product facts.'); }
    finally { setLoading(false); }
  }

  return (
    <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <h2 className="text-lg font-bold text-white">Qlynk product information update</h2>
      <p className="mt-2 text-sm text-gray-300">Review the free Creator and MIT facts and instructions, then update this agent after the new webapp is live. Obsolete pricing sources and instructions have an undo backup.</p>
      <button onClick={review} disabled={loading} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">{loading ? 'Working…' : 'Review product update'}</button>
      {message && <p role="status" className="mt-3 text-sm text-gray-200">{message}</p>}
      {preview && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-gray-200">{preview.staleSources.length} obsolete sources to archive. {preview.changedFactCount} facts to add or refresh.</p>
          <details className="rounded-xl border border-white/10 p-4">
            <summary className="cursor-pointer font-bold text-white">Review the approved facts and affected sources</summary>
            {preview.facts.map(fact => <div key={fact.title} className="mt-4"><h3 className="font-semibold text-white">{fact.title}</h3><p className="mt-1 text-sm text-gray-300">{fact.content}</p></div>)}
            <h3 className="mt-6 font-semibold text-white">Updated product instructions</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{preview.updatedRules.custom_instructions}</p>
            <h3 className="mt-4 font-semibold text-white">Allowed topics and behavior</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">{[...preview.updatedRules.allowed_topics, ...preview.updatedRules.behavior_rules].map((rule, index) => <li key={index}>{rule}</li>)}</ul>
            <h3 className="mt-6 font-semibold text-white">Sources to archive</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">{preview.staleSources.map(source => <li key={source.id}>{source.title}</li>)}</ul>
          </details>
          <p className="text-sm text-amber-200">Applying this pack changes the information this published product agent can use immediately. Apply it only after the pricing and free-plan release is live.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => update('apply')} disabled={loading || preview.canUndo} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">Apply reviewed facts to agent</button>
            {preview.canUndo && <button onClick={() => update('undo')} disabled={loading} className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white disabled:opacity-50">Undo product update</button>}
            <button onClick={() => setPreview(null)} disabled={loading} className="rounded-xl px-4 py-2 text-gray-300">Close review</button>
          </div>
        </div>
      )}
    </section>
  );
}
