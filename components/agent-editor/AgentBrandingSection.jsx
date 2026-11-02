import Image from 'next/image';
import { Bot, Loader2, Upload, Sparkles } from 'lucide-react';

export default function AgentBrandingSection({
  config,
  updateConfig,
  avatarUploading,
  handleAvatarUpload
}) {
  return (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f46530]/10 rounded flex items-center justify-center">
                <Bot size={18} className="text-[#f46530]" />
              </div>
              Agent Branding
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={config.agent_name}
                  onChange={(e) => updateConfig('agent_name', e.target.value)}
                  placeholder="Your AI"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role / Display Title</label>
                <input
                  type="text"
                  value={config.profession || ''}
                  onChange={(e) => updateConfig('profession', e.target.value)}
                  placeholder="e.g. Digital Creator, Software Engineer"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                <p className="text-xs text-gray-500 mb-2">The main brand color for your avatar and fallback for buttons.</p>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                    className="w-12 h-12 rounded-xl border border-gray-700/50 bg-gray-900/50 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Agent Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative group">
                    {config.agent_avatar ? (
                      <Image
                        src={config.agent_avatar}
                        alt="AI agent avatar preview"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Bot className="text-gray-600" size={32} />
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="text-white animate-spin" size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer transition-all">
                      <Upload size={16} />
                      {config.agent_avatar ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={avatarUploading}
                      />
                    </label>
                    <p className="text-[10px] text-gray-500 mt-2">Square images work best. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Widget Position</label>
                <select
                  value={config.position}
                  onChange={(e) => updateConfig('position', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  AI Tone & Personality
                  <Sparkles size={14} className="text-[#f46530]" />
                </label>
                <select
                  value={config.tone || 'professional'}
                  onChange={(e) => updateConfig('tone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="professional">Professional (Polished & Formal)</option>
                  <option value="friendly">Friendly (Approachable & Warm)</option>
                  <option value="funny">Funny (Witty & Entertaining)</option>
                  <option value="creative">Creative (Visionary & Bold)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Welcome Message</label>
                <textarea
                  value={config.welcome_message}
                  onChange={(e) => updateConfig('welcome_message', e.target.value)}
                  placeholder="Hi! I'm the AI assistant for this page. How can I help you?"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all resize-none"
                />
              </div>
            </div>
          </div>
  );
}
