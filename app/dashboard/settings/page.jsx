'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase';
import { 
  Save, 
  User, 
  Mail, 
  Shield, 
  Sparkles, 
  Loader2, 
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Bell,
  MessageSquare,
  CreditCard,
  Clock,
  AlertTriangle
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';
import { toast, Toaster } from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f46530');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState('immediate');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [accountDeletionRequestedAt, setAccountDeletionRequestedAt] = useState(null);
  const [accountDeletionScheduledFor, setAccountDeletionScheduledFor] = useState(null);

  // Notification preferences
  const [notifNewMessage, setNotifNewMessage] = useState(true);
  const [notifTrialExpiry, setNotifTrialExpiry] = useState(true);
  const [notifSubscription, setNotifSubscription] = useState(true);
  const savedSettingsRef = useRef(null);
  const currentSettings = {
    fullName, bio, primaryColor, email, newPassword, avatarUrl,
    notifNewMessage, notifTrialExpiry, notifSubscription,
  };
  const isDirty = savedSettingsRef.current !== null
    && JSON.stringify(currentSettings) !== savedSettingsRef.current;

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        setUser(currentUser);
        setEmail(currentUser.email);

        const currentProfile = await getCurrentProfile();
        const loadedFullName = currentProfile?.full_name || '';
        const loadedAvatarUrl = currentProfile?.avatar_url || '';
        const loadedNotifNewMessage = currentProfile?.notif_new_message !== false;
        const loadedNotifTrialExpiry = currentProfile?.notif_trial_expiry !== false;
        const loadedNotifSubscription = currentProfile?.notif_subscription !== false;
        setFullName(loadedFullName);
        setAvatarUrl(loadedAvatarUrl);
        setNotifNewMessage(loadedNotifNewMessage);
        setNotifTrialExpiry(loadedNotifTrialExpiry);
        setNotifSubscription(loadedNotifSubscription);
        if (currentProfile) {
          setAccountDeletionRequestedAt(currentProfile.account_deletion_requested_at || null);
          setAccountDeletionScheduledFor(currentProfile.account_deletion_scheduled_for || null);
        }

        // Fetch bio from agent_configs as it's the primary source for the AI
        const supabase = createClient();
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('bio, primary_color')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        const loadedBio = agentConfig?.bio || '';
        const loadedPrimaryColor = agentConfig?.primary_color || '#f46530';
        setBio(loadedBio);
        setPrimaryColor(loadedPrimaryColor);
        savedSettingsRef.current = JSON.stringify({
          fullName: loadedFullName,
          bio: loadedBio,
          primaryColor: loadedPrimaryColor,
          email: currentUser.email,
          newPassword: '',
          avatarUrl: loadedAvatarUrl,
          notifNewMessage: loadedNotifNewMessage,
          notifTrialExpiry: loadedNotifTrialExpiry,
          notifSubscription: loadedNotifSubscription,
        });

      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [isDirty]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // 1. Update Profile (full_name, avatar_url, notification prefs)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl,
          notif_new_message: notifNewMessage,
          notif_trial_expiry: notifTrialExpiry,
          notif_subscription: notifSubscription,
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

      savedSettingsRef.current = JSON.stringify({ ...currentSettings, newPassword: '' });

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

  const handleDeleteAccount = async (mode) => {
    if (!user) return;

    if (mode !== 'cancel') {
      if (deleteEmailConfirm.trim().toLowerCase() !== user.email?.toLowerCase()) {
        toast.error('Please type your current email address exactly.');
        return;
      }

      if (deletePhrase.trim() !== 'DELETE MY ACCOUNT') {
        toast.error('Please type DELETE MY ACCOUNT to confirm.');
        return;
      }
    }

    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          mode,
          email: deleteEmailConfirm,
          confirmation: deletePhrase,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      if (mode === 'scheduled') {
        setAccountDeletionRequestedAt(data.account_deletion_requested_at || null);
        setAccountDeletionScheduledFor(data.account_deletion_scheduled_for || null);
        setDeleteOpen(false);
        toast.success('Account deletion scheduled');
      } else if (mode === 'cancel') {
        setAccountDeletionRequestedAt(null);
        setAccountDeletionScheduledFor(null);
        toast.success('Scheduled deletion cancelled');
      } else {
        toast.success('Account deleted');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
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
    <div className="w-full max-w-[1440px] px-5 sm:px-7 lg:px-9 py-8 sm:py-10">
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
                  <Image src={avatarUrl} alt="User profile avatar" width={128} height={128} className="w-full h-full object-cover" />
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
                placeholder="Add account context that may help configure your Qlynk Agent."
              />
              <p className="text-xs text-gray-500 mt-2 italic">This bio is part of the approved context available to your Qlynk Agent.</p>
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

        {/* Notification Preferences */}
        <div id="notifications" className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 hover:border-[#f46530]/20 hover:bg-white/10 transition-all group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#f46530]/10 text-[#f46530] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Email Notifications</h2>
              <p className="text-gray-400 text-sm">Choose which emails you want to receive</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#f46530]/30 hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">New Conversations</p>
                  <p className="text-gray-500 text-xs">Get notified when someone starts chatting with your agent</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifNewMessage(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                  notifNewMessage ? 'bg-[#f46530] shadow-lg shadow-[#f46530]/30' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                  notifNewMessage ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#f46530]/30 hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Trial & Expiry Reminders</p>
                  <p className="text-gray-500 text-xs">Warnings before your trial ends and expiry notices</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifTrialExpiry(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                  notifTrialExpiry ? 'bg-[#f46530] shadow-lg shadow-[#f46530]/30' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                  notifTrialExpiry ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#f46530]/30 hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Billing & Subscription</p>
                  <p className="text-gray-500 text-xs">Renewal confirmations and billing events</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifSubscription(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                  notifSubscription ? 'bg-[#f46530] shadow-lg shadow-[#f46530]/30' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                  notifSubscription ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 mb-8 hover:border-red-500/35 hover:bg-red-500/10 transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Danger Zone</h2>
              <p className="text-gray-400 text-sm">Delete your account and remove all associated Qlynk data</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm text-gray-300 leading-relaxed">
                You can delete immediately, or choose a 7-day buffer if you want time to change your mind. When the scheduled date arrives, your account is automatically marked for removal and the final purge usually completes later that day. Deletion removes your profile, public page, knowledge, conversations, documents, billing records in Supabase, uploaded avatar files, and your qlynk.site/username URL.
              </p>
              {accountDeletionScheduledFor && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <p className="font-semibold">Deletion pending</p>
                  {accountDeletionRequestedAt && (
                    <p className="mt-1 text-amber-100/80">
                      Requested on {new Date(accountDeletionRequestedAt).toLocaleString()}.
                    </p>
                  )}
                  <p className="mt-1">
                    Your account will be permanently deleted on {new Date(accountDeletionScheduledFor).toLocaleString()}.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Cancel your scheduled account deletion?')) return;
                      await handleDeleteAccount('cancel');
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/40 px-4 py-2 text-xs font-bold text-amber-50 hover:bg-amber-400/10 transition-all"
                  >
                    Cancel deletion
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setDeleteMode('scheduled');
                  setDeleteOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Clock size={18} />
                Delete in 7 days
              </button>
              <button
                onClick={() => {
                  setDeleteMode('immediate');
                  setDeleteOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
              >
                <Trash2 size={18} />
                Delete now
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-20">
          <button 
            onClick={handleSave}
            disabled={saving || !isDirty}
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

      {deleteOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-red-500/20 bg-[#0b0b10] p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">
                  {deleteMode === 'scheduled' ? 'Schedule account deletion?' : 'Delete account?'}
                </h3>
                <p className="text-sm text-gray-400">
                  {deleteMode === 'scheduled'
                    ? 'You will keep access until the deletion date.'
                    : 'This cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100 leading-relaxed">
                {deleteMode === 'scheduled'
                  ? 'This will mark your account for permanent deletion in 7 days. You can cancel before then from this screen. The final purge runs automatically and may complete later that day.'
                  : 'Deleting now removes your public URL, dashboard data, chat history, documents, knowledge base, avatar uploads, billing records, and your auth user.'}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Confirm your current email</label>
                <input
                  type="email"
                  value={deleteEmailConfirm}
                  onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  placeholder={user?.email || 'you@example.com'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Type DELETE MY ACCOUNT</label>
                <input
                  type="text"
                  value={deletePhrase}
                  onChange={(e) => setDeletePhrase(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 px-5 py-3 rounded-2xl bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(deleteMode)}
                  disabled={deleting}
                  className="flex-1 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-400 transition-all disabled:opacity-60"
                >
                  {deleting
                    ? (deleteMode === 'scheduled' ? 'Scheduling...' : 'Deleting...')
                    : (deleteMode === 'scheduled' ? 'Schedule deletion' : 'Delete permanently')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
