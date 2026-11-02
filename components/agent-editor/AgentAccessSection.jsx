import { AlertCircle } from 'lucide-react';

export default function AgentAccessSection({
  config,
  updateConfig,
  accessPassword,
  setAccessPassword,
  passwordIsSet
}) {
  return (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
                <AlertCircle size={18} className="text-purple-400" />
              </div>
              Security & Access Control
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Control who can chat with your agent. Note: Visitors will always be asked for their name before chatting so you can easily identify them in your chat logs.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all bg-gray-900/50 hover:bg-gray-900/80 border-gray-700/50 hover:border-purple-500/30">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="access_level"
                    value="public"
                    checked={config.access_level === 'public' || !config.access_level}
                    onChange={(e) => updateConfig('access_level', e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-600"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Public Access (Open Door)</span>
                  <span className="text-sm text-gray-400">Anyone with the link can chat with your agent.</span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all bg-gray-900/50 hover:bg-gray-900/80 border-gray-700/50 hover:border-purple-500/30">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="access_level"
                    value="email"
                    checked={config.access_level === 'email'}
                    onChange={(e) => updateConfig('access_level', e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-600"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Email Capture</span>
                  <span className="text-sm text-gray-400">Collects a valid-looking email before chat; it does not verify ownership. Use a password for restricted access.</span>
                </div>
              </label>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all bg-gray-900/50 hover:bg-gray-900/80 border-gray-700/50 hover:border-purple-500/30">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="access_level"
                      value="password"
                      checked={config.access_level === 'password'}
                      onChange={(e) => updateConfig('access_level', e.target.value)}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-600"
                    />
                  </div>
                  <div className="flex flex-col w-full">
                    <span className="text-white font-medium">Password Protected</span>
                    <span className="text-sm text-gray-400">Set a custom password that visitors must enter to unlock the chat.</span>
                  </div>
                </label>
                
                {config.access_level === 'password' && (
                  <div className="ml-12 mr-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Access Password</label>
                    <input
                      type="password"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      placeholder={passwordIsSet ? 'Enter a new password to replace the current one' : 'Enter a secret password...'}
                      minLength={6}
                      maxLength={200}
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-gray-900 transition-all"
                    />
                    {passwordIsSet && (
                      <p className="mt-2 text-xs text-green-400">A password is set. Leave this blank to keep it unchanged.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}
