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
  EyeOff,
  Upload,
  Trash2
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
  const [primaryColor, setPrimaryColor] = useState('#f46530');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

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
          setAvatarUrl(currentProfile.avatar_url || '');
        }

        // Fetch bio from agent_configs as it's the primary source for the AI
        const supabase = createClient();
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('bio, primary_color')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (agentConfig) {
          setBio(agentConfig.bio || '');
          setPrimaryColor(agentConfig.primary_color || '#f46530');
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

      // 1. Update Profile (full_name, avatar_url)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Agent Config (bio)
      const { error: configError } = await supabase
        .from('agent_configs')
        .upsert({ 
          user_id: user.id, 
          bio: bio,
          primary_color: primaryColor,
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded! Click save to apply.');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading image');
    } finally {
      setAvatarUploading(false);
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
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 hover:border-blue-500/20 hover:bg-white/10 transition-all group">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center relative shadow-2xl group-hover:border-[#f46530]/50 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-700" />
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="text-white animate-spin" size={24} />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#f46530] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-[#0a0a0f]">
                <Upload size={18} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  disabled={avatarUploading}
                />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Profile Photo</h2>
              <p className="text-gray-400 text-sm mb-4">This photo will be used in your dashboard and communications.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setAvatarUrl('')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-red-400 hover:border-red-400/50 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Remove Photo
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-white/10 transition-all" 
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-white/10 transition-all h-32 resize-none" 
                placeholder="Tell us about yourself... this is used to train your AI representative." 
              />
              <p className="text-xs text-gray-500 mt-2 italic">This bio is the primary source of truth for your AI clone.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Primary Brand Color</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 cursor-pointer overflow-hidden p-0.5" 
                />
                <input 
                  type="text" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-white/10 transition-all font-mono" 
                  placeholder="#f46530" 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">This color is used for your agent's branding and buttons.</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 hover:border-purple-500/20 hover:bg-white/10 transition-all group">
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
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-white/10 transition-all" 
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-white/10 transition-all" 
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
