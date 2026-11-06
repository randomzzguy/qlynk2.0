import { Palette, Type, MessageSquare } from 'lucide-react';
import ColorField from './ColorField';
import { GOOGLE_FONTS } from './agent-editor-defaults';

export default function AgentVisualSection({
  config,
  updateConfig,
  isPersonalAgent
}) {
  return (
    <>
          {/* Visual Style Customization */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-pink-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-500/10 rounded flex items-center justify-center">
                <Palette size={18} className="text-pink-400" />
              </div>
              Visual Style
            </h2>
            <p className="text-sm text-gray-400 mb-6">Customize the colors and font on your public chat page and website widget.</p>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Controls column */}
              <div className="space-y-6">
                {/* Font */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Type size={14} className="text-pink-400" />
                    Font Family
                  </label>
                  <select
                    value={config.font_family || 'Inter'}
                    onChange={(e) => updateConfig('font_family', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 focus:bg-gray-900 transition-all appearance-none cursor-pointer"
                    style={{ fontFamily: config.font_family || 'Inter' }}
                  >
                    {GOOGLE_FONTS.map(f => (
                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Applied across the entire chat page</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ColorField
                    label="Page Background"
                    value={config.chat_bg_color}
                    onChange={(v) => updateConfig('chat_bg_color', v)}
                    hint="Background of the whole page"
                  />
                  <ColorField
                    label="CTA Button Color"
                    value={config.cta_button_color}
                    onChange={(v) => updateConfig('cta_button_color', v)}
                    hint="Primary chat button"
                  />
                  <ColorField
                    label="CTA Button Text"
                    value={config.cta_text_color}
                    onChange={(v) => updateConfig('cta_text_color', v)}
                    hint="Text on the CTA button"
                  />
                  <ColorField
                    label="Heading Text"
                    value={config.heading_text_color || '#ffffff'}
                    onChange={(v) => updateConfig('heading_text_color', v)}
                    hint="Agent name and welcome headings"
                  />
                  <ColorField
                    label="Bio / Pre-Chat Text"
                    value={config.pre_chat_text_color}
                    onChange={(v) => updateConfig('pre_chat_text_color', v)}
                    hint="Bio text & tagline color"
                  />
                  <ColorField
                    label="Welcome Page Text"
                    value={config.gatekeeper_text_color}
                    onChange={(v) => updateConfig('gatekeeper_text_color', v)}
                    hint="'Please introduce yourself' page"
                  />
                  <ColorField
                    label="User Bubble Color"
                    value={config.user_bubble_color}
                    onChange={(v) => updateConfig('user_bubble_color', v)}
                    hint="Your visitor's chat bubbles"
                  />
                  <ColorField
                    label="AI Bubble Color"
                    value={config.ai_bubble_color}
                    onChange={(v) => updateConfig('ai_bubble_color', v)}
                    hint="Your AI agent's chat bubbles"
                  />
                </div>
              </div>

              {/* Live Preview column */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Live Preview</p>
                <div
                  className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{ background: config.chat_bg_color || '#0a0a0f', fontFamily: `'${config.font_family || 'Inter'}', sans-serif` }}
                >
                  {/* Mini landing preview */}
                  <div className="p-6 border-b border-white/10">
                    <p className="font-black text-lg mb-1" style={{ color: config.heading_text_color || '#ffffff' }}>{config.agent_name || 'Your AI'}</p>
                    <p className="text-xs mb-4" style={{ color: config.pre_chat_text_color || '#9ca3af' }}>
                      {config.bio || 'Ask me anything about my work or background.'}
                    </p>
                    <button
                      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 pointer-events-none"
                      style={{ background: config.cta_button_color || '#f46530', color: config.cta_text_color || '#ffffff' }}
                    >
                      <MessageSquare size={16} />
                      Chat with {config.agent_name || 'Agent'}
                    </button>
                  </div>
                  {/* Mini chat preview */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-start">
                      <div className="px-4 py-2 rounded-2xl text-sm text-white max-w-[80%]" style={{ background: config.ai_bubble_color || '#3b82f620', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {config.welcome_message || "Hi! How can I help you?"}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="px-4 py-2 rounded-2xl text-sm text-white max-w-[80%]" style={{ background: config.user_bubble_color || '#ffffff1a', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {isPersonalAgent ? 'Tell me about your projects' : 'What can you help me with?'}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="px-4 py-2 rounded-2xl text-sm text-white max-w-[80%]" style={{ background: config.ai_bubble_color || '#3b82f620', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {isPersonalAgent ? 'Sure! Here are some highlights...' : 'Here are the topics I can help with.'}
                      </div>
                    </div>
                  </div>
                  {/* Mini gatekeeper preview */}
                  <div className="p-4 border-t border-white/10">
                    <p className="text-xs font-bold mb-1" style={{ color: config.heading_text_color || '#ffffff' }}>Welcome Page</p>
                    <p className="text-xs" style={{ color: config.gatekeeper_text_color || '#9ca3af' }}>
                      Please introduce yourself before chatting with {config.agent_name || 'Your AI'}.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">Preview updates live as you change settings</p>
              </div>
            </div>
          </div>

    </>
  );
}
