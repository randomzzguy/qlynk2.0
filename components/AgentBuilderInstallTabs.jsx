'use client';

import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';

const tabs = [
  {
    id: 'codex',
    label: 'Codex',
    title: 'Install the official Codex plugin',
    status: 'Official plugin · Live',
    statusClass: 'text-emerald-300',
    description: 'Open the verified Qlynk Agent Builder listing in ChatGPT and select Install plugin.',
    command: 'Official listing: chatgpt.com/plugins/plugins_6a7a8eef28608191869f04ead95cd5b2',
    invocation: 'Use $build-qlynk-agent to build a Qlynk Agent for my client.',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    title: 'Install in Claude Code',
    status: 'Community directory · Under review',
    statusClass: 'text-amber-200',
    description: 'The Claude-compatible package is available from GitHub now. Its Claude community directory submission is still under review.',
    command: `claude plugin marketplace add randomzzguy/qlynk-agent-builder\nclaude plugin install qlynk-agent-builder@qlynk`,
    invocation: '/qlynk-agent-builder:build-qlynk-agent',
  },
  {
    id: 'standalone',
    label: 'Standalone',
    title: 'Download the Agent Skill',
    status: 'Direct download',
    statusClass: 'text-gray-300',
    description: 'One portable skill works in both platforms when copied to the appropriate personal or repository skill folder.',
    command: `Codex:  $HOME/.agents/skills/build-qlynk-agent\nClaude: $HOME/.claude/skills/build-qlynk-agent`,
    invocation: 'Preserve the complete folder, including references.',
  },
];

export default function AgentBuilderInstallTabs({ downloadPath, githubUrl, codexPluginUrl, version }) {
  const [active, setActive] = useState('codex');
  const selected = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
      <div className="grid grid-cols-3 border-b border-white/10 p-2" role="tablist" aria-label="Installation platform">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`install-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`install-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`min-w-0 rounded-xl px-2 py-3 text-xs font-black transition sm:px-5 sm:text-sm ${active === tab.id ? 'bg-orange text-white' : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`install-panel-${selected.id}`}
        role="tabpanel"
        aria-labelledby={`install-tab-${selected.id}`}
        className="grid min-w-0 gap-7 p-7 lg:grid-cols-[0.8fr_1.2fr] lg:p-10"
      >
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${selected.statusClass}`}>{selected.status}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Version {version}</p>
          <h3 className="mt-3 text-2xl font-black">{selected.title}</h3>
          <p className="mt-4 leading-relaxed text-gray-400">{selected.description}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {selected.id === 'codex' && (
              <a href={codexPluginUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-black text-white transition hover:bg-[#c14f22]">
                Install official plugin <ExternalLink size={15} />
              </a>
            )}
            <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:border-orange/60 hover:bg-white/[0.06]">
              View documentation <ExternalLink size={15} />
            </a>
            <a href={downloadPath} download className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-gray-950 transition hover:bg-gray-200">
              Download skill <Download size={15} />
            </a>
          </div>
        </div>

        <div className="min-w-0">
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-7 text-gray-300"><code>{selected.command}</code></pre>
          <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Start with</p>
            <code className="mt-2 block break-words text-sm text-gray-200">{selected.invocation}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
