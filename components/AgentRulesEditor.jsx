'use client';

import { useState } from 'react';
import { History, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AGENT_TYPE_CATALOG } from '@/lib/agent-type-catalog';
import { RULE_LIMITS } from '@/lib/agent-rules';

function ListField({ label, description, values, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <textarea
        value={(values || []).join('\n')}
        onChange={(event) => onChange(event.target.value.split('\n').slice(0, RULE_LIMITS.listItems))}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-y"
      />
      <p className="text-[10px] text-gray-600 mt-1">One item per line, up to {RULE_LIMITS.listItems}.</p>
    </div>
  );
}

export default function AgentRulesEditor({
  agentType,
  onAgentTypeChange,
  rules,
  onRulesChange,
  promptVersion,
  versions = [],
  securitySummary = { total: 0, prompt_injection: 0, off_topic: 0, safety: 0 },
  onRestoreVersion,
  restoring = false,
}) {
  const [selectedVersion, setSelectedVersion] = useState('');
  const updateRule = (field, value) => onRulesChange({ ...rules, [field]: value });

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-6 mb-8 shadow-[0_0_40px_rgba(6,182,212,0.05)]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-7">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <SlidersHorizontal size={18} className="text-cyan-400" />
            </span>
            Agent Type & Rules
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Shape what your agent represents and how it should respond. Qlynk&apos;s security, privacy, and cost safeguards always remain active.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 whitespace-nowrap">
          <ShieldCheck size={14} />
          Platform policy protected
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" aria-label="Blocked request activity in the last 30 days">
        {[
          ['Blocked requests', securitySummary.total || 0],
          ['Prompt attacks', securitySummary.prompt_injection || 0],
          ['Off-topic', securitySummary.off_topic || 0],
          ['Safety blocks', securitySummary.safety || 0],
        ].map(([label, value]) => (
          <div key={label} className="p-3 rounded-xl bg-black/20 border border-white/10">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold text-white mb-3">What should this agent represent?</label>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {AGENT_TYPE_CATALOG.map((type) => {
            const selected = agentType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onAgentTypeChange(type.id)}
                aria-pressed={selected}
                className={`text-left p-4 rounded-2xl border transition-all ${selected
                  ? 'bg-cyan-500/10 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-black/20 border-white/10 hover:border-white/25 hover:bg-white/5'}`}
              >
                <span className={`block text-sm font-bold ${selected ? 'text-cyan-300' : 'text-white'}`}>{type.label}</span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{type.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent purpose</label>
          <p className="text-xs text-gray-500 mb-2">The primary job this agent is allowed to perform.</p>
          <textarea
            value={rules.purpose || ''}
            onChange={(event) => updateRule('purpose', event.target.value.slice(0, RULE_LIMITS.purpose))}
            rows={3}
            maxLength={RULE_LIMITS.purpose}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-y"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Intended audience</label>
          <input
            type="text"
            value={rules.audience || ''}
            onChange={(event) => updateRule('audience', event.target.value.slice(0, RULE_LIMITS.audience))}
            maxLength={RULE_LIMITS.audience}
            placeholder="For example: new volunteers, house staff, and maintenance workers"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <ListField
          label="Allowed topics"
          description="Topics that are clearly within scope. These improve off-topic filtering."
          values={rules.allowed_topics}
          onChange={(value) => updateRule('allowed_topics', value)}
          placeholder={'Daily chores\nEquipment instructions\nInventory locations'}
        />
        <ListField
          label="Blocked topics"
          description="Subjects this agent should always decline or escalate."
          values={rules.blocked_topics}
          onChange={(value) => updateRule('blocked_topics', value)}
          placeholder={'Alarm and lock codes\nPrivate guest information\nFinancial records'}
        />
        <ListField
          label="Do rules"
          description="Approved behavior within the agent's scope."
          values={rules.behavior_rules}
          onChange={(value) => updateRule('behavior_rules', value)}
          placeholder={'Use numbered steps for procedures\nMention the storage location when known'}
        />
        <ListField
          label="Don’t rules"
          description="Behavior the agent must avoid in addition to Qlynk's fixed safeguards."
          values={rules.forbidden_behaviors}
          onChange={(value) => updateRule('forbidden_behaviors', value)}
          placeholder={'Do not guess inventory quantities\nDo not approve safety-critical repairs'}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Scope enforcement</label>
          <select
            value={rules.scope_mode || 'standard'}
            onChange={(event) => updateRule('scope_mode', event.target.value)}
            className="w-full px-4 py-3 bg-gray-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="standard">Standard — allow reasonably related questions</option>
            <option value="strict">Strict — block uncertain or loosely related questions</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Response length</label>
          <select
            value={rules.response_length || 'balanced'}
            onChange={(event) => updateRule('response_length', event.target.value)}
            className="w-full px-4 py-3 bg-gray-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">When information is missing</label>
          <textarea
            value={rules.uncertainty_message || ''}
            onChange={(event) => updateRule('uncertainty_message', event.target.value.slice(0, RULE_LIMITS.uncertaintyMessage))}
            rows={3}
            maxLength={RULE_LIMITS.uncertaintyMessage}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Human escalation message</label>
          <textarea
            value={rules.escalation_message || ''}
            onChange={(event) => updateRule('escalation_message', event.target.value.slice(0, RULE_LIMITS.escalationMessage))}
            rows={3}
            maxLength={RULE_LIMITS.escalationMessage}
            placeholder="For anything unsafe or uncertain, contact the property manager."
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Optional daily message cap</label>
          <p className="text-xs text-gray-500 mb-2">A hard owner-controlled cap in addition to plan and visitor limits.</p>
          <input
            type="number"
            min={RULE_LIMITS.dailyMessageLimitMin}
            max={RULE_LIMITS.dailyMessageLimitMax}
            value={rules.daily_message_limit ?? ''}
            onChange={(event) => updateRule('daily_message_limit', event.target.value ? Number(event.target.value) : null)}
            placeholder="No additional daily cap"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-400" />
            Advanced instructions
          </label>
          <p className="text-xs text-gray-500 mb-2">Lower-priority customization. It cannot replace Qlynk policy.</p>
          <textarea
            value={rules.custom_instructions || ''}
            onChange={(event) => updateRule('custom_instructions', event.target.value.slice(0, RULE_LIMITS.customInstructions))}
            rows={4}
            maxLength={RULE_LIMITS.customInstructions}
            placeholder="Use the property's room names exactly as written in the knowledge base."
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-y"
          />
          <p className="text-[10px] text-gray-600 mt-1 text-right">{(rules.custom_instructions || '').length}/{RULE_LIMITS.customInstructions}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <History size={14} />
          Prompt version {promptVersion || 'not saved yet'}
        </div>
        {versions.length > 1 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedVersion}
              onChange={(event) => setSelectedVersion(event.target.value)}
              className="px-3 py-2 bg-gray-950 border border-white/10 rounded-lg text-xs text-gray-300"
            >
              <option value="">Choose an earlier version</option>
              {versions.filter((version) => version.version !== promptVersion).map((version) => (
                <option key={version.version} value={version.version}>
                  Version {version.version} · {version.agent_type} · {new Date(version.created_at).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedVersion || restoring}
              onClick={async () => {
                await onRestoreVersion(Number(selectedVersion));
                setSelectedVersion('');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw size={14} className={restoring ? 'animate-spin' : ''} />
              Restore & publish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
