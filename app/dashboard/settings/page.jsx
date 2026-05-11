'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase';
import { 
  Save, 
  User, 
  Mail, 
  Shield, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';
import { toast, Toaster } from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        setUser(currentUser);
        setEmail(currentUser.email);

        const currentProfile = await getCurrentProfile();
        if (currentProfile) {
          setProfile(currentProfile);
          setFullName(currentProfile.full_name || '');
        }

        // Fetch bio from agent_configs as it's the primary source for the AI
        const supabase = createClient();
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('bio')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (agentConfig) {
          setBio(agentConfig.bio || '');
        }

      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // 1. Update Profile (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Agent Config (bio)
      const { error: configError } = await supabase
        .from('agent_configs')
        .upsert({ 
          user_id: user.id, 
          bio: bio,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (configError) throw configError;

      // 3. Update Auth Email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast.success('Confirmation email sent to new address');
      }

      // 4. Update Password if provided
      if (newPassword) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdError) throw pwdError;
        setNewPassword('');
        toast.success('Password updated successfully');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#f46530] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Toaster position="top-right" />
      <UpgradePrompt />

      <h1 className="text-3xl font-black text-white mb-10 flex items-center gap-3">
        Settings
        <Sparkles size={20} className="text-[#f46530]" />
      </h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8 hover:border-blue-500/20 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Profile Settings</h2>
              <p className="text-gray-400 text-sm">Manage your personal information and AI bio</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" 
                placeholder="John Doe" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 flex justify-between">
                AI Knowledge Bio
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-black">Agent Core</span>
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all h-32 resize-none" 
                placeholder="Tell us about yourself... this is used to train your AI representative." 
              />
              <p className="text-xs text-gray-500 mt-2 italic">This bio is the primary source of truth for your AI clone.</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8 hover:border-purple-500/20 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account & Security</h2>
              <p className="text-gray-400 text-sm">Update your credentials and password</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" 
                  placeholder="john@example.com" 
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-2 ml-1">Changing email requires confirmation.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all" 
                  placeholder="Leave blank to keep current" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-20">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-10 py-4 bg-[#f46530] text-white rounded-2xl font-black text-lg hover:bg-[#f46530]/90 shadow-[0_10px_30px_rgba(244,101,48,0.3)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            {saving ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Save size={22} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
