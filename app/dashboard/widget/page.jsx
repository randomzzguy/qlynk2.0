'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bot,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  Globe2,
  Loader2,
  MessageCircle,
  Monitor,
  Palette,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { buildWidgetEmbedCode } from '@/lib/widget-installations';
import { hasAgencyFeatures } from '@/lib/plans';
import UpgradePrompt from '@/components/UpgradePrompt';

const DEFAULT_FORM = {
  name: 'Primary website widget',
  is_enabled: true,
  allowed_origins: '',
  position: 'bottom-right',
  launcher_color: '#f46530',
  pre_chat_enabled: false,
  pre_chat_email_enabled: true,
  pre_chat_email_required: false,
  pre_chat_intro: 'Tell us who you are so we can better assist you.',
};

function formFromWidget(widget, agent) {
  return {
    name: widget.name,
    is_enabled: widget.is_enabled,
    allowed_origins: (widget.allowed_origins || []).join('\n'),
    position: widget.position,
    launcher_color: widget.launcher_color || agent?.primary_color || '#f46530',
    pre_chat_enabled: widget.pre_chat_enabled === true,
    pre_chat_email_enabled: widget.pre_chat_email_enabled !== false,
    pre_chat_email_required: widget.pre_chat_email_required === true,
    pre_chat_intro: widget.pre_chat_intro || DEFAULT_FORM.pre_chat_intro,
  };
}

function formSnapshot(form) {
  return JSON.stringify({ ...form, allowed_origins: form.allowed_origins.trim() });
}

function WidgetPreview({ form, agent, mobile }) {
  const color = form.launcher_color || agent?.primary_color || '#f46530';
  const emailAccessRequired = agent?.access_level === 'email';
  const showsEmail = emailAccessRequired || form.pre_chat_email_enabled;
  const requiresEmail = emailAccessRequired || form.pre_chat_email_required;
  return (
    <div className={`relative mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-[#f7f7f8] shadow-2xl transition-all ${mobile ? 'h-[500px] w-[280px]' : 'h-[500px] w-full max-w-[680px]'}`}>
      <div className="h-12 border-b border-black/5 bg-white px-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 h-6 flex-1 rounded-lg bg-gray-100" />
      </div>
      <div className="p-6">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-3 w-full rounded bg-gray-200/70" />
        <div className="mt-2 h-3 w-4/5 rounded bg-gray-200/70" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-white shadow-sm" />
          <div className="h-24 rounded-xl bg-white shadow-sm" />
        </div>
      </div>

      <div className={`absolute bottom-20 w-[min(340px,calc(100%-24px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${form.position === 'bottom-left' ? 'left-3' : 'right-3'}`}>
        <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: color }}>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {agent?.agent_avatar
              ? <Image src={agent.agent_avatar} alt="" width={36} height={36} className="h-full w-full object-cover" />
              : <Bot size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold">{agent?.agent_name || 'Qlynk Agent'}</p>
            <p className="text-[11px] text-white/75">Online</p>
          </div>
        </div>
        <div className="h-40 overflow-hidden bg-gray-50 p-4">
          {form.pre_chat_enabled ? (
            <div className="mx-auto max-w-[260px]">
              <p className="text-xs font-bold text-gray-800">Before we start</p>
              <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-gray-500">{form.pre_chat_intro}</p>
              <div className="mt-2 h-7 rounded-lg border border-gray-200 bg-white px-2 text-[9px] leading-7 text-gray-400">Your name</div>
              {showsEmail && <div className="mt-1.5 h-7 rounded-lg border border-gray-200 bg-white px-2 text-[9px] leading-7 text-gray-400">Email{requiresEmail ? '' : ' (optional)'}</div>}
              <div className="mt-2 h-7 rounded-lg text-center text-[9px] font-bold leading-7 text-white" style={{ backgroundColor: color }}>Start chat</div>
            </div>
          ) : (
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-xs leading-relaxed text-gray-600 shadow-sm">
              {agent?.welcome_message || 'Hi! How can I help you today?'}
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="h-9 rounded-full bg-gray-100" />
        </div>
      </div>

      <div className={`absolute bottom-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl ${form.position === 'bottom-left' ? 'left-4' : 'right-4'}`} style={{ backgroundColor: color }}>
        <MessageCircle size={24} />
      </div>
    </div>
  );
}

export default function WebsiteWidgetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widget, setWidget] = useState(null);
  const [agent, setAgent] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [copied, setCopied] = useState(false);

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.qlynk.site').replace(/\/$/, '');
  const embedCode = useMemo(
    () => buildWidgetEmbedCode(origin, widget?.id),
    [origin, widget?.id]
  );
  const agencyBranding = hasAgencyFeatures(subscription?.tier);
  const emailAccessRequired = agent?.access_level === 'email';
  const isDirty = useMemo(
    () => !widget || !savedForm || formSnapshot(form) !== formSnapshot(savedForm),
    [form, savedForm, widget]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/widget-installations', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load the website widget.');
        setWidget(data.widget);
        setAgent(data.agent);
        setSubscription(data.subscription);
        if (data.widget) {
          const nextForm = formFromWidget(data.widget, data.agent);
          setForm(nextForm);
          setSavedForm(nextForm);
        } else if (data.agent?.primary_color) {
          setForm((current) => ({ ...current, launcher_color: data.agent.primary_color }));
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event) => {
      if (loading || !isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [isDirty, loading]);

  useEffect(() => {
    const hasUnsavedChanges = Boolean(!loading && isDirty);
    window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { dirty: hasUnsavedChanges } }));
    return () => window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { dirty: false } }));
  }, [isDirty, loading]);

  const payload = () => ({
    ...form,
    allowed_origins: form.allowed_origins
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean),
  });

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/widget-installations', {
        method: widget ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the widget.');
      setWidget(data.widget);
      const nextForm = formFromWidget(data.widget, agent);
      setForm(nextForm);
      setSavedForm(nextForm);
      toast.success(widget ? 'Widget changes published' : 'Website widget created');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Installation code copied');
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#f46530]" size={30} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] px-5 py-8 sm:px-7 sm:py-10 lg:px-9">
      <UpgradePrompt />

      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f46530]/25 bg-[#f46530]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#ff8a5f]">
            <Globe2 size={13} /> Website channel
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-white">
            Website Widget <Sparkles size={20} className="text-[#f46530]" />
          </h1>
          <p className="mt-2 max-w-2xl text-gray-400">
            Put this Qlynk Agent on a client website while keeping its approved knowledge, rules, conversations, and usage in one place.
          </p>
        </div>
        {(!widget || isDirty || saving) && (
        <button
          type="button"
          onClick={save}
          disabled={saving || !subscription?.is_live || (Boolean(widget) && !isDirty)}
          className="dashboard-save-bar inline-flex items-center justify-center gap-2 rounded-xl bg-[#f46530] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#f46530]/20 transition hover:bg-[#df5929] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : widget && !isDirty ? <Check size={17} /> : widget ? <Save size={17} /> : <Sparkles size={17} />}
          {widget ? (isDirty ? 'Publish changes' : 'Saved') : 'Create widget'}
        </button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-white">Widget settings</h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">Changes affect the website widget only.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, is_enabled: !current.is_enabled }))}
                className={form.is_enabled ? 'text-emerald-400' : 'text-gray-500'}
                aria-label={form.is_enabled ? 'Disable widget' : 'Enable widget'}
              >
                {form.is_enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-300">Internal name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  maxLength={80}
                  className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f46530]/60"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-semibold text-gray-300">Launcher color</span>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={form.launcher_color}
                    onChange={(event) => setForm((current) => ({ ...current, launcher_color: event.target.value }))}
                    className="h-11 w-12 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/20"
                  />
                  <input
                    value={form.launcher_color}
                    onChange={(event) => setForm((current) => ({ ...current, launcher_color: event.target.value }))}
                    maxLength={7}
                    className="flex-1 rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#f46530]/60"
                  />
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold text-gray-300">Position</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['bottom-left', 'Bottom left'],
                    ['bottom-right', 'Bottom right'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, position: value }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${form.position === value ? 'border-[#f46530]/60 bg-[#f46530]/10 text-white' : 'border-white/10 bg-black/20 text-gray-500 hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <ShieldCheck size={15} className="text-emerald-400" /> Allowed websites
                </span>
                <textarea
                  value={form.allowed_origins}
                  onChange={(event) => setForm((current) => ({ ...current, allowed_origins: event.target.value }))}
                  rows={4}
                  placeholder={'https://client.com\nhttps://www.client.com'}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-xs leading-relaxed text-white outline-none transition focus:border-[#f46530]/60"
                />
                <span className="mt-2 block text-xs leading-relaxed text-gray-500">
                  One exact website origin per line. Leave blank to allow any website.
                </span>
              </label>

              <div className="border-t border-white/10 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="block text-sm font-semibold text-gray-300">Pre-chat customer details</span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">Ask for a name before chat. Customer details are saved only after their first message.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, pre_chat_enabled: !current.pre_chat_enabled }))}
                    className={form.pre_chat_enabled ? 'shrink-0 text-emerald-400' : 'shrink-0 text-gray-500'}
                    aria-label={form.pre_chat_enabled ? 'Disable pre-chat customer details' : 'Enable pre-chat customer details'}
                  >
                    {form.pre_chat_enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                  </button>
                </div>

                {form.pre_chat_enabled && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-gray-400">Form introduction</span>
                      <textarea
                        value={form.pre_chat_intro}
                        onChange={(event) => setForm((current) => ({ ...current, pre_chat_intro: event.target.value }))}
                        maxLength={240}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#f46530]/60"
                      />
                      <span className="mt-1 block text-right text-[10px] text-gray-600">{form.pre_chat_intro.length}/240</span>
                    </label>

                    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-3 py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-300">Name</p>
                        <p className="mt-0.5 text-[10px] text-gray-600">Always required when this form is enabled</p>
                      </div>
                      <span className="rounded-full bg-[#f46530]/10 px-2 py-1 text-[10px] font-bold text-[#ff8a5f]">Required</span>
                    </div>

                    <div className="rounded-xl border border-white/10 px-3 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-300">Show email field</p>
                          <p className="mt-0.5 text-[10px] text-gray-600">Let visitors share an email address</p>
                        </div>
                        <button
                          type="button"
                          disabled={emailAccessRequired}
                          onClick={() => setForm((current) => ({
                            ...current,
                            pre_chat_email_enabled: !current.pre_chat_email_enabled,
                            pre_chat_email_required: current.pre_chat_email_enabled ? false : current.pre_chat_email_required,
                          }))}
                          className={`${form.pre_chat_email_enabled || emailAccessRequired ? 'text-emerald-400' : 'text-gray-500'} disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label={emailAccessRequired ? 'Email field required by access control' : form.pre_chat_email_enabled ? 'Hide email field' : 'Show email field'}
                        >
                          {form.pre_chat_email_enabled || emailAccessRequired ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                        </button>
                      </div>
                      {emailAccessRequired ? (
                        <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-amber-400/80">
                          Email is required because this agent uses Email access control.
                        </p>
                      ) : form.pre_chat_email_enabled && (
                        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-white/10 pt-3 text-xs text-gray-400">
                          <input
                            type="checkbox"
                            checked={form.pre_chat_email_required}
                            onChange={(event) => setForm((current) => ({ ...current, pre_chat_email_required: event.target.checked }))}
                            className="h-4 w-4 accent-[#f46530]"
                          />
                          Require an email before chat
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                <Palette size={19} />
              </div>
              <div>
                <h2 className="font-bold text-white">Branding</h2>
                <p className="text-xs text-gray-500">{agencyBranding ? 'White-label active' : 'Qlynk attribution shown'}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {agencyBranding
                ? 'Your current plan removes the visible “Powered by Qlynk” label from the widget.'
                : 'Creator widgets keep a small “Powered by Qlynk” label. Agency removes it and raises the message allowance.'}
            </p>
            {!agencyBranding && (
              <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#ff8a5f] hover:text-white">
                Compare Agency <ExternalLink size={14} />
              </Link>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-white">Website preview</h2>
                <p className="mt-1 text-xs text-gray-500">A visual preview of the client-site experience.</p>
              </div>
              <div className="flex w-fit rounded-xl border border-white/10 bg-black/25 p-1">
                <button type="button" onClick={() => setPreviewMode('desktop')} className={`rounded-lg p-2 ${previewMode === 'desktop' ? 'bg-white text-black' : 'text-gray-500'}`} aria-label="Desktop preview"><Monitor size={17} /></button>
                <button type="button" onClick={() => setPreviewMode('mobile')} className={`rounded-lg p-2 ${previewMode === 'mobile' ? 'bg-white text-black' : 'text-gray-500'}`} aria-label="Mobile preview"><Smartphone size={17} /></button>
              </div>
            </div>
            <WidgetPreview form={form} agent={agent} mobile={previewMode === 'mobile'} />
          </section>

          <section className="rounded-3xl border border-[#f46530]/20 bg-gradient-to-br from-[#f46530]/10 to-white/[0.025] p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Code2 size={17} className="text-[#f46530]" /> Installation code
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-gray-400">
                  Paste this once before the closing <code className="text-gray-300">&lt;/body&gt;</code> tag on the client website. Qlynk hosts and updates the widget automatically.
                </p>
              </div>
              {widget && (
                <button type="button" onClick={copyCode} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200">
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Clipboard size={16} />}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              )}
            </div>
            <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-gray-300">
              <code>{embedCode || 'Create the widget to generate its installation code.'}</code>
            </pre>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> No client-site dependency</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Automatic Qlynk updates</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Conversations stay in Qlynk</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
