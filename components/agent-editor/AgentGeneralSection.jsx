import { Bot, Sparkles, Eye, EyeOff } from 'lucide-react';
import AgentRulesEditor from '@/components/AgentRulesEditor';
import { DEFAULT_AGENT_TYPE } from '@/lib/agent-type-catalog';
import AgentAccessSection from './AgentAccessSection';
import AgentBrandingSection from './AgentBrandingSection';

export default function AgentGeneralSection({
  config,
  updateConfig,
  setupPanel,
  setSetupPanel,
  handleAgentTypeChange,
  agentRules,
  setAgentRules,
  promptVersion,
  ruleVersions,
  securitySummary,
  restoreRuleVersion,
  restoringRules,
  accessPassword,
  setAccessPassword,
  passwordIsSet,
  avatarUploading,
  handleAvatarUpload
}) {
  return (
    <>
          {/* Enable/Disable Toggle */}
          <div className="bg-white/[0.035] backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  config.is_enabled 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                    : 'bg-gray-700/50 border border-gray-600/50'
                }`}>
                  <Bot className={config.is_enabled ? 'text-green-400' : 'text-gray-500'} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Agent Status
                    {config.is_enabled && <Sparkles size={16} className="text-[#f46530]" />}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {config.is_enabled ? 'Your Qlynk Agent is live and visible to visitors' : 'Your Qlynk Agent is currently offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  config.is_enabled 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                }`}>
                  {config.is_enabled ? (
                    <>
                      <Eye size={16} />
                      Live
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} />
                      Offline
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => updateConfig('is_enabled', !config.is_enabled)}
                  aria-label={config.is_enabled ? 'Take agent offline' : 'Publish agent'}
                  aria-pressed={config.is_enabled}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    config.is_enabled 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30' 
                      : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    config.is_enabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-2 p-1.5 mb-6 rounded-2xl border border-white/10 bg-black/20">
            {[
              { id: 'role', label: 'Role & Rules', detail: 'Purpose, scope, and behavior' },
              { id: 'access', label: 'Access & Safety', detail: 'Visitor access and protection' },
              { id: 'branding', label: 'Identity & Welcome', detail: 'Name, avatar, tone, and sharing' },
            ].map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setSetupPanel(panel.id)}
                aria-pressed={setupPanel === panel.id}
                className={`rounded-xl px-4 py-3 text-left transition-all ${setupPanel === panel.id
                  ? 'bg-white/10 border border-white/15 shadow-lg text-white'
                  : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className="block text-sm font-bold">{panel.label}</span>
                <span className="block text-[11px] mt-0.5 text-gray-500">{panel.detail}</span>
              </button>
            ))}
          </div>

          {setupPanel === 'role' && (
          <AgentRulesEditor
            agentType={config.agent_type || DEFAULT_AGENT_TYPE}
            onAgentTypeChange={handleAgentTypeChange}
            rules={agentRules}
            onRulesChange={setAgentRules}
            promptVersion={promptVersion}
            versions={ruleVersions}
            securitySummary={securitySummary}
            onRestoreVersion={restoreRuleVersion}
            restoring={restoringRules}
          />
          )}

          {setupPanel === 'access' && <AgentAccessSection config={config} updateConfig={updateConfig} accessPassword={accessPassword} setAccessPassword={setAccessPassword} passwordIsSet={passwordIsSet} />}

          {setupPanel === 'branding' && <AgentBrandingSection config={config} updateConfig={updateConfig} avatarUploading={avatarUploading} handleAvatarUpload={handleAvatarUpload} />}


    </>
  );
}
