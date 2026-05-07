'use client';

import { Save, User, Mail, Shield, Sparkles } from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function SettingsPage() {
    return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <UpgradePrompt />

      <h1 className="text-3xl font-black text-white mb-10 flex items-center gap-3">
        Settings
        <Sparkles size={20} className="text-[#f46530]" />
      </h1>

                    <div className="space-y-6">
                        {/* Profile Settings */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8 hover:border-blue-500/20 transition-all">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Profile Settings</h2>
                                    <p className="text-gray-400 text-sm">Manage your personal information</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">First Name</label>
                                        <input type="text" className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Last Name</label>
                                        <input type="text" className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" placeholder="Doe" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Bio</label>
                                    <textarea className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all h-32 resize-none" placeholder="Tell us about yourself..." />
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8 hover:border-purple-500/20 transition-all">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Account & Security</h2>
                                    <p className="text-gray-400 text-sm">Update your password and security</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                        <input type="email" className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" placeholder="john@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">New Password</label>
                                    <input type="password" className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end mb-20">
                            <button className="flex items-center gap-2 px-8 py-3 bg-[#f46530] text-white rounded-xl font-bold hover:bg-[#f46530]/90 shadow-lg shadow-[#f46530]/20 transition-all">
                                <Save size={20} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
    );
}
