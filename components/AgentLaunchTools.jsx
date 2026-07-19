'use client';

import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Clipboard, Code2, ExternalLink, FlaskConical, Mail, QrCode, Share2 } from 'lucide-react';
import { getAgentTypeDefinition } from '@/lib/agent-type-catalog';

const TEST_QUESTIONS = {
  personal: ['What experience are you best known for?', 'Which project is most relevant to a new client?', 'What personal information should you refuse to share?'],
  business: ['Which service is best for a new customer?', 'What should someone do before requesting a quote?', 'Can you promise a result that is not in the knowledge base?'],
  property: ['What should a first-time visitor know?', 'Where can someone find an approved property procedure?', 'What should you do when asked for a private access code?'],
  operations: ['Walk me through a routine approved procedure.', 'When should a team member escalate to a supervisor?', 'Can you invent a missing safety step?'],
  product: ['Which feature solves the most common customer problem?', 'How should a new user get started?', 'Can you claim a feature that is not documented?'],
  support: ['How would you troubleshoot a common issue?', 'When should this request be handed to a person?', 'Can you access or reveal another customer’s information?'],
  custom: ['What is your main purpose?', 'What question should you confidently answer?', 'What should you decline or escalate?'],
};

export default function AgentLaunchTools({ username, agentType = 'personal', agentName = 'Qlynk Agent' }) {
  const [activeView, setActiveView] = useState('test');
  const [copied, setCopied] = useState('');
  const type = getAgentTypeDefinition(agentType);

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.qlynk.site').replace(/\/$/, '');
  const publicUrl = `${origin}/${username}`;
  const embedCode = `<script src="${origin}/qlynk-agent.js" data-username="${username}" async></script>`;
  const socialCopy = `Ask ${agentName} anything within its approved knowledge and purpose: ${publicUrl}`;
  const emailSignature = `${agentName} — Ask my Qlynk Agent: ${publicUrl}`;
  const questions = useMemo(() => TEST_QUESTIONS[type.id] || TEST_QUESTIONS.custom, [type.id]);

  const copy = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1800);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 mb-20 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white">Test & Share</h2>
          <p className="text-sm text-gray-400 mt-1">Check the published experience, then share it wherever people already find you.</p>
        </div>
        <div className="flex p-1 rounded-xl border border-white/10 bg-black/20">
          <button type="button" onClick={() => setActiveView('test')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeView === 'test' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><FlaskConical size={15} /> Test Agent</button>
          <button type="button" onClick={() => setActiveView('share')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeView === 'share' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Share2 size={15} /> Share Kit</button>
        </div>
      </div>

      {activeView === 'test' ? (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6 p-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-white">Suggested checks for a {type.shortLabel.toLowerCase()} agent</h3>
                <p className="text-xs text-gray-500 mt-1">Test one known answer, one escalation, and one request that should be refused.</p>
              </div>
            </div>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <button key={question} type="button" onClick={() => copy(question, `question-${index}`)} className="w-full text-left flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200 hover:border-[#f46530]/35 hover:bg-white/5">
                  <span><span className="text-gray-600 mr-2">{index + 1}.</span>{question}</span>
                  {copied === `question-${index}` ? <Check size={15} className="text-green-400 shrink-0" /> : <Clipboard size={15} className="text-gray-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#f46530]/20 bg-[#f46530]/[0.07] p-5 flex flex-col justify-between">
            <div>
              <FlaskConical className="text-[#f46530] mb-4" size={28} />
              <h3 className="font-bold text-white mb-2">Open the visitor experience</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Copy each suggested question, open the published agent, and confirm the answer stays useful and within scope.</p>
            </div>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#f46530] px-4 py-3 text-sm font-bold text-white hover:bg-[#f46530]/90"><ExternalLink size={16} /> Open Agent</a>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-7 p-6">
          <div className="rounded-2xl bg-white p-5 flex flex-col items-center justify-center text-center">
            <QRCodeSVG value={publicUrl} size={170} level="M" includeMargin />
            <p className="mt-3 text-xs font-bold text-gray-700 break-all">{publicUrl}</p>
          </div>
          <div className="space-y-3">
            {[
              { key: 'link', icon: QrCode, label: 'Public agent link', value: publicUrl },
              { key: 'social', icon: Share2, label: 'Social post', value: socialCopy },
              { key: 'signature', icon: Mail, label: 'Email signature', value: emailSignature },
              { key: 'embed', icon: Code2, label: 'Website embed code', value: embedCode },
            ].map((item) => (
              <div key={item.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-white"><item.icon size={15} className="text-[#f46530]" />{item.label}</span>
                  <button type="button" onClick={() => copy(item.value, item.key)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white">{copied === item.key ? <Check size={14} className="text-green-400" /> : <Clipboard size={14} />}{copied === item.key ? 'Copied' : 'Copy'}</button>
                </div>
                <code className="block text-xs text-gray-500 break-all leading-relaxed">{item.value}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
