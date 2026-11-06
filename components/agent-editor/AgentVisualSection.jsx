'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Palette } from 'lucide-react';
import ColorField from './ColorField';
import AgentBrandingSection from './AgentBrandingSection';
import { GOOGLE_FONTS } from './agent-editor-defaults';
import WidgetPreview from '@/components/WidgetPreview';
import FullPageChat from '@/components/FullPageChat';
import { PRE_CHAT_COLOR_FIELDS, resolvePreChatStyle, sanitizePreChatStyle } from '@/lib/widget-pre-chat-style';
import { resolveWidgetTheme } from '@/lib/widget-theme';

const COLOR_GROUPS = [
  { title: 'Page & headings', description: 'The public page and its introduction.', fields: [
    ['chat_bg_color', 'Page & chat background', '#0a0a0f'],
    ['heading_text_color', 'Agent name & headings', '#ffffff'],
    ['pre_chat_text_color', 'Bio & tagline', '#9ca3af'],
    ['gatekeeper_text_color', 'Public welcome form text', '#9ca3af'],
  ] },
  { title: 'Buttons & messages', description: 'Shared by the public chat and website widget.', fields: [
    ['cta_button_color', 'Primary & send buttons', '#f46530'],
    ['cta_text_color', 'Button text & icons', '#ffffff'],
    ['ai_bubble_color', 'Agent message background', '#3b82f620'],
    ['user_bubble_color', 'Visitor message background', '#ffffff1a'],
  ] },
];

export default function AgentVisualSection({ config, updateConfig, avatarUploading, handleAvatarUpload }) {
  const [screen, setScreen] = useState('widget');
  const [widget, setWidget] = useState(null);
  const [tier, setTier] = useState(null);
  const [style, setStyle] = useState({});
  const [savedStyle, setSavedStyle] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const styleDirty = JSON.stringify(style) !== JSON.stringify(savedStyle);
  const colors = resolvePreChatStyle(style, resolveWidgetTheme({ agent: config }));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/widget-installations', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load widget appearance.');
        if (cancelled) return;
        setWidget(data.widget);
        setTier(data.subscription?.tier);
        setStyle(data.widget?.pre_chat_style || {});
        setSavedStyle(data.widget?.pre_chat_style || {});
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { source: 'widget-appearance', dirty: styleDirty } }));
    const warn = (event) => {
      if (!styleDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { source: 'widget-appearance', dirty: false } }));
    };
  }, [styleDirty]);

  const saveFormColors = async () => {
    const sanitized = sanitizePreChatStyle(style);
    if (sanitized.error) { setNotice(sanitized.error); return; }
    setSaving(true);
    setNotice('');
    try {
      const response = await fetch('/api/widget-installations', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_chat_style: sanitized.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to publish form colors.');
      setWidget(data.widget);
      setStyle(data.widget.pre_chat_style);
      setSavedStyle(data.widget.pre_chat_style);
      setNotice('Pre-chat form colors published.');
    } catch (err) { setNotice(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <details className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]" open>
          <summary className="cursor-pointer px-6 py-5 font-bold text-white">Identity & welcome</summary>
          <AgentBrandingSection config={config} updateConfig={updateConfig} avatarUploading={avatarUploading} handleAvatarUpload={handleAvatarUpload} />
        </details>
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <h2 className="mb-2 font-bold text-white">Typography</h2>
          <label className="mt-4 block text-sm text-gray-400" htmlFor="chat-font">Font family</label>
          <select id="chat-font" value={config.font_family || 'Inter'} onChange={(event) => updateConfig('font_family', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-white">
            {GOOGLE_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <p className="mt-2 text-xs text-gray-500">Used on the public page, widget, and previews.</p>
        </section>
        {COLOR_GROUPS.map((group) => (
          <section key={group.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <h2 className="font-bold text-white">{group.title}</h2>
            <p className="mb-5 mt-1 text-xs leading-relaxed text-gray-500">{group.description}</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {group.fields.map(([key, label, fallback]) => (
                <ColorField key={key} label={label} value={config[key] || fallback} onChange={(value) => updateConfig(key, value)} />
              ))}
            </div>
          </section>
        ))}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <h2 className="font-bold text-white">Website pre-chat form</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">Colors for the customer-details form. These widget settings publish separately using the button below.</p>
          {loading ? <p className="mt-4 text-sm text-gray-400">Loading form colors…</p> : error ? <p role="alert" className="mt-4 text-sm text-red-300">{error}</p> : !widget ? (
            <Link href="/dashboard/widget" className="mt-4 inline-block text-sm text-[#ff8a5f]">Create a website widget to customize its pre-chat form →</Link>
          ) : (
            <>
              {!widget.pre_chat_enabled && <p className="mt-4 text-xs text-amber-300">Pre-chat customer details are off. Enable them on the Website Widget page when ready.</p>}
              <button type="button" onClick={() => setScreen('pre-chat')} className="mt-4 text-sm text-[#ff8a5f]">Preview pre-chat form →</button>
              {[
                ['Surface & text', ['backgroundColor', 'headingColor', 'introColor', 'supportingTextColor']],
                ['Fields', ['labelColor', 'inputBackgroundColor', 'inputTextColor', 'placeholderColor', 'inputBorderColor', 'focusColor']],
                ['Start button', ['buttonColor', 'buttonTextColor']],
              ].map(([title, keys]) => (
                <details key={title} className="mt-4 rounded-2xl border border-white/10 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-200">{title}</summary>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {PRE_CHAT_COLOR_FIELDS.filter(({ key }) => keys.includes(key)).map(({ key, label }) => (
                      <ColorField key={key} label={label} value={style[key] ?? colors[key]} placeholder="#rrggbb or #rrggbbaa" onChange={(value) => { setStyle((current) => ({ ...current, [key]: value })); setNotice(''); }} />
                    ))}
                  </div>
                </details>
              ))}
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" disabled={saving || !styleDirty} onClick={saveFormColors} className="inline-flex items-center gap-2 rounded-xl bg-[#f46530] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                  {saving && <Loader2 size={16} className="animate-spin" />} Publish form colors
                </button>
                <button type="button" disabled={saving} onClick={() => { setStyle({}); setNotice(''); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 disabled:opacity-40">Use chat defaults</button>
                {styleDirty && <button type="button" disabled={saving} onClick={() => { setStyle(savedStyle); setNotice(''); }} className="text-sm text-gray-400">Discard color changes</button>}
              </div>
              {notice && <p role="status" className="mt-3 text-sm text-gray-300">{notice}</p>}
            </>
          )}
        </section>
      </div>
      <aside className="min-w-0 space-y-4 xl:sticky xl:top-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-bold text-white"><Palette size={18} className="text-pink-400" /> Live preview</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-gray-500">Uses the same components as your published agent. Messages here are samples.</p>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Preview screen">
            {[
              ['widget', 'Widget chat'], ['landing', 'Public page'], ['chat', 'Public chat'], ['welcome', 'Public welcome'], ['pre-chat', 'Widget form'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setScreen(id)} aria-pressed={screen === id} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${screen === id ? 'border-[#f46530]/50 bg-[#f46530]/10 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>{label}</button>
            ))}
          </div>
          {screen === 'widget' || screen === 'pre-chat' ? (
            <WidgetPreview agent={config} form={{ ...widget, pre_chat_style: style }} screen={screen === 'pre-chat' ? 'pre-chat' : 'chat'} tier={tier} />
          ) : (
            <div className="h-[620px] overflow-hidden rounded-2xl border border-white/10">
              <FullPageChat key={screen} preview previewScreen={screen} agentConfig={config} profile={{ name: config.agent_name }} tier={tier} />
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-gray-500">Publish agent changes to update the live chat. <Link href="/dashboard/widget" className="text-[#ff8a5f]">Launcher color, placement, and form fields →</Link></p>
        </div>
      </aside>
    </div>
  );
}
