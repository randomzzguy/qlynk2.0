'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AgentRulesEditor from '@/components/AgentRulesEditor';
import { DEFAULT_AGENT_TYPE, getAgentTypeDefinition } from '@/lib/agent-type-catalog';
import { DEFAULT_AGENT_RULES, normalizeAgentRules } from '@/lib/agent-rules';
import { getCurrentUser } from '@/lib/supabase';
import { 
  Bot, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  FileText,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Palette,
  Type,
  MessageSquare
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';
import AgentLaunchTools from '@/components/AgentLaunchTools';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Outfit',
  'Poppins',
  'Sora',
  'DM Sans',
  'Space Grotesk',
  'Plus Jakarta Sans',
  'Nunito',
  'Raleway',
  'Lato',
  'Montserrat',
  'Open Sans',
  'Source Code Pro',
  'Fira Code',
];

function ColorField({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex gap-3 items-center">
        <div className="relative">
          <input
            type="color"
            value={value?.length === 9 ? value.substring(0, 7) : (value || '#000000')}
            onChange={(e) => {
              // If the original value had alpha, try to preserve it
              if (value?.length === 9) {
                onChange(e.target.value + value.substring(7));
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-11 h-11 rounded-xl border border-gray-700/50 bg-gray-900/50 cursor-pointer overflow-hidden p-0.5"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all font-mono text-sm"
          placeholder="#rrggbb or rgba(...)"
        />
      </div>
    </div>
  );
}

export function AgentConfigPage({ sectionOverride = null, embedded = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = sectionOverride || searchParams.get('section') || 'general';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAction, setSavingAction] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [saveMessage, setSaveMessage] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Agent config state
  const [config, setConfig] = useState({
    agent_name: 'Your AI',
    agent_avatar: '',
    welcome_message: 'Hi! I\'m the AI assistant for this page. How can I help you?',
    bio: '',
    skills: [],
    projects: [],
    contact_info: {
      email: '',
      phone: '',
      location: '',
      website: '',
      calendly: ''
    },
    social_links: [],
    custom_knowledge: '',
    primary_color: '#f46530',
    position: 'bottom-right',
    is_enabled: true,
    tone: 'professional',
    agent_type: DEFAULT_AGENT_TYPE,
    access_level: 'public',
    // Visual customization
    chat_bg_color: '#0a0a0f',
    user_bubble_color: '#ffffff1a',
    ai_bubble_color: '#3b82f620',
    cta_button_color: '#f46530',
    cta_text_color: '#ffffff',
    pre_chat_text_color: '#9ca3af',
    gatekeeper_text_color: '#9ca3af',
    font_family: 'Inter',
    profession: 'Digital Creator',
  });

  // Form input states for arrays
  const [newSkill, setNewSkill] = useState({ name: '', level: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '' });
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });
  const [accessPassword, setAccessPassword] = useState('');
  const [passwordIsSet, setPasswordIsSet] = useState(false);
  const [agentRules, setAgentRules] = useState({ ...DEFAULT_AGENT_RULES });
  const [promptVersion, setPromptVersion] = useState(0);
  const [ruleVersions, setRuleVersions] = useState([]);
  const [securitySummary, setSecuritySummary] = useState({ total: 0, prompt_injection: 0, off_topic: 0, safety: 0, last_event_at: null });
  const [restoringRules, setRestoringRules] = useState(false);
  const [setupPanel, setSetupPanel] = useState('role');
  const savedConfigRef = useRef(null);
  const savedRulesRef = useRef(null);
  const hasContentChanges = savedConfigRef.current !== null
    && (
      JSON.stringify(config) !== savedConfigRef.current
      || (savedRulesRef.current !== null && JSON.stringify(agentRules) !== savedRulesRef.current)
    );
  const isDirty = hasContentChanges || Boolean(accessPassword);
  const selectedAgentType = getAgentTypeDefinition(config.agent_type || DEFAULT_AGENT_TYPE);
  const isPersonalAgent = selectedAgentType.id === 'personal';

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUserId(user.id);

        const supabase = createClient();
        
        // Get username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }

        // Get existing agent config
        const { data: existingConfig } = await supabase
          .from('agent_configs')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingConfig) {
          delete existingConfig.access_password;
          setConfig((current) => {
            const loadedConfig = {
              ...current,
              ...existingConfig,
              agent_type: existingConfig.agent_type || DEFAULT_AGENT_TYPE,
              skills: existingConfig.skills || [],
              projects: existingConfig.projects || [],
              contact_info: existingConfig.contact_info || {},
              social_links: existingConfig.social_links || [],
            };
            savedConfigRef.current = JSON.stringify(loadedConfig);
            return loadedConfig;
          });
        } else {
          setConfig((current) => {
            savedConfigRef.current = JSON.stringify(current);
            return current;
          });
        }

        const passwordStatusResponse = await fetch('/api/agent/access-password', {
          cache: 'no-store',
        });
        if (passwordStatusResponse.ok) {
          const passwordStatus = await passwordStatusResponse.json();
          setPasswordIsSet(Boolean(passwordStatus.passwordSet));
        }

        const rulesResponse = await fetch('/api/agent/rules', { cache: 'no-store' });
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          const loadedRules = normalizeAgentRules(rulesData.rules || {}, rulesData.agent_type || DEFAULT_AGENT_TYPE);
          setAgentRules(loadedRules);
          savedRulesRef.current = JSON.stringify(loadedRules);
          setPromptVersion(rulesData.prompt_version || 0);
          setRuleVersions(rulesData.versions || []);
          setSecuritySummary(rulesData.security_summary || { total: 0, prompt_injection: 0, off_topic: 0, safety: 0, last_event_at: null });
          setConfig((current) => {
            const next = { ...current, agent_type: rulesData.agent_type || current.agent_type || DEFAULT_AGENT_TYPE };
            savedConfigRef.current = JSON.stringify(next);
            return next;
          });
        } else {
          setAgentRules((current) => {
            const next = normalizeAgentRules(current, existingConfig?.agent_type || DEFAULT_AGENT_TYPE);
            savedRulesRef.current = JSON.stringify(next);
            return next;
          });
        }

        // A private draft takes precedence in the editor, while the public
        // agent continues using the published rows above.
        const draftResponse = await fetch('/api/agent/draft', { cache: 'no-store' });
        if (draftResponse.ok) {
          const draftData = await draftResponse.json();
          if (draftData.draft) {
            const draftConfig = draftData.draft.config || {};
            const draftRules = normalizeAgentRules(
              draftData.draft.rules || {},
              draftConfig.agent_type || existingConfig?.agent_type || DEFAULT_AGENT_TYPE,
            );
            setConfig((current) => {
              const next = { ...current, ...draftConfig };
              savedConfigRef.current = JSON.stringify(next);
              return next;
            });
            setAgentRules(draftRules);
            savedRulesRef.current = JSON.stringify(draftRules);
            setHasDraft(true);
            setDraftSavedAt(draftData.draft.updated_at);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading config:', error);
        setLoading(false);
      }
    };

    loadConfig();
  }, [router]);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [isDirty]);

  const handleSaveDraft = async () => {
    if (!userId || !hasContentChanges) return;
    setSaving(true);
    setSavingAction('draft');
    setSaveStatus(null);
    setSaveMessage('');

    try {
      const response = await fetch('/api/agent/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, rules: agentRules }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save this draft');

      const savedRules = normalizeAgentRules(result.rules || agentRules, config.agent_type || DEFAULT_AGENT_TYPE);
      setAgentRules(savedRules);
      savedConfigRef.current = JSON.stringify(config);
      savedRulesRef.current = JSON.stringify(savedRules);
      setHasDraft(true);
      setDraftSavedAt(result.updated_at);
      setSaveStatus('success');
      setSaveMessage('Draft saved. Visitors still see the published version.');
    } catch (error) {
      console.error('Error saving agent draft:', error);
      setSaveStatus('error');
      setSaveMessage(error.message || 'Unable to save this draft.');
    } finally {
      setSaving(false);
      setSavingAction(null);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    if (config.access_level === 'password' && !passwordIsSet && !accessPassword) {
      setSaveStatus('error');
      return;
    }
    
    setSaving(true);
    setSavingAction('publish');
    setSaveStatus(null);
    setSaveMessage('');

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('agent_configs')
        .upsert({
          user_id: userId,
          ...config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      const rulesResponse = await fetch('/api/agent/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: config.agent_type || DEFAULT_AGENT_TYPE,
          rules: agentRules,
        }),
      });
      const rulesResult = await rulesResponse.json();
      if (!rulesResponse.ok) {
        throw new Error(rulesResult.error || 'Unable to save agent rules');
      }

      if (config.access_level === 'password' && accessPassword) {
        const passwordResponse = await fetch('/api/agent/access-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: accessPassword }),
        });
        const passwordResult = await passwordResponse.json();
        if (!passwordResponse.ok) {
          throw new Error(passwordResult.error || 'Unable to save access password');
        }
        setAccessPassword('');
        setPasswordIsSet(true);
      }

      const snapshotResponse = await fetch('/api/agent/publish-snapshot', { method: 'POST' });
      const snapshotResult = await snapshotResponse.json();
      if (!snapshotResponse.ok) {
        throw new Error(snapshotResult.error || 'Published, but unable to record the new version.');
      }

      savedConfigRef.current = JSON.stringify(config);
      savedRulesRef.current = JSON.stringify(rulesResult.rules);
      setAgentRules(rulesResult.rules);
      setPromptVersion(rulesResult.prompt_version || promptVersion);
      if (rulesResult.prompt_version) {
        setRuleVersions((current) => [{
          version: rulesResult.prompt_version,
          agent_type: rulesResult.agent_type,
          created_at: new Date().toISOString(),
        }, ...current.filter((version) => version.version !== rulesResult.prompt_version)].slice(0, 10));
      }
      
      setSaveStatus('success');
      setSaveMessage(`Published version ${snapshotResult.version}. Your live agent is up to date.`);
      setHasDraft(false);
      setDraftSavedAt(null);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (error) {
      console.error('[v0] Error saving config:', error);
      setSaveStatus('error');
      setSaveMessage(error.message || 'Unable to publish these changes.');
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setSaving(false);
      setSavingAction(null);
    }
  };

  const handleDiscardDraft = async () => {
    if (!hasDraft || !window.confirm('Discard this saved draft and reload the published agent settings?')) return;
    setSaving(true);
    setSavingAction('draft');
    try {
      const response = await fetch('/api/agent/draft', { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to discard the draft');
      window.location.reload();
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error.message || 'Unable to discard the draft.');
      setSaving(false);
      setSavingAction(null);
    }
  };

  const handleAgentTypeChange = (nextType) => {
    const currentType = config.agent_type || DEFAULT_AGENT_TYPE;
    const currentDefaultPurpose = getAgentTypeDefinition(currentType).defaultPurpose;
    const nextDefaultPurpose = getAgentTypeDefinition(nextType).defaultPurpose;
    setConfig((current) => ({ ...current, agent_type: nextType }));
    setAgentRules((current) => ({
      ...current,
      purpose: !current.purpose || current.purpose === currentDefaultPurpose
        ? nextDefaultPurpose
        : current.purpose,
    }));
  };

  const restoreRuleVersion = async (version) => {
    setRestoringRules(true);
    setSaveStatus(null);
    try {
      const response = await fetch('/api/agent/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to restore this version');

      const restoredRules = normalizeAgentRules(result.rules || {}, result.agent_type || DEFAULT_AGENT_TYPE);
      const nextConfig = { ...config, agent_type: result.agent_type || DEFAULT_AGENT_TYPE };
      setConfig(nextConfig);
      setAgentRules(restoredRules);
      setPromptVersion(result.prompt_version || promptVersion);
      savedConfigRef.current = JSON.stringify(nextConfig);
      savedRulesRef.current = JSON.stringify(restoredRules);

      const snapshotResponse = await fetch('/api/agent/publish-snapshot', { method: 'POST' });
      const snapshotResult = await snapshotResponse.json();
      if (!snapshotResponse.ok) throw new Error(snapshotResult.error || 'Rules restored, but the publish snapshot failed.');
      setHasDraft(false);
      setDraftSavedAt(null);

      const refreshed = await fetch('/api/agent/rules', { cache: 'no-store' });
      if (refreshed.ok) {
        const data = await refreshed.json();
        setRuleVersions(data.versions || []);
      }
      setSaveStatus('success');
      setSaveMessage(`Restored and published prompt version ${result.prompt_version}.`);
    } catch (error) {
      console.error('Error restoring agent rules:', error);
      setSaveStatus('error');
    } finally {
      setRestoringRules(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateConfig('agent_avatar', publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar image');
    } finally {
      setAvatarUploading(false);
    }
  };

  const updateConfig = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateContactInfo = (field, value) => {
    setConfig(prev => ({
      ...prev,
      contact_info: { ...prev.contact_info, [field]: value }
    }));
  };

  // Skills management
  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setConfig(prev => ({
      ...prev,
      skills: [...prev.skills, { ...newSkill }]
    }));
    setNewSkill({ name: '', level: '' });
  };

  const removeSkill = (index) => {
    setConfig(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Projects management
  const addProject = () => {
    if (!newProject.name.trim()) return;
    setConfig(prev => ({
      ...prev,
      projects: [...prev.projects, { ...newProject }]
    }));
    setNewProject({ name: '', description: '', url: '' });
  };

  const removeProject = (index) => {
    setConfig(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Social links management
  const addSocialLink = () => {
    if (!newSocialLink.platform.trim() || !newSocialLink.url.trim()) return;
    setConfig(prev => ({
      ...prev,
      social_links: [...prev.social_links, { ...newSocialLink }]
    }));
    setNewSocialLink({ platform: '', url: '' });
  };

  const removeSocialLink = (index) => {
    setConfig(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'min-h-[240px]' : 'min-h-[60vh]'}`}>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="w-7 h-7 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
          {embedded && <span>Loading profile context...</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'w-full' : 'w-full max-w-[1440px] px-5 sm:px-7 lg:px-9 py-8 sm:py-10'}>
      {!embedded && <UpgradePrompt />}

      {/* Header */}
      <div className={`${embedded ? 'rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5 backdrop-blur-xl' : ''} flex flex-col md:flex-row justify-between items-start md:items-center mb-7 gap-4`}>
        <div>
          <h1 className={`${embedded ? 'text-xl' : 'text-3xl'} font-black text-white mb-1 flex items-center gap-3`}>
            {section === 'visual' ? 'Visual Style' : section === 'profile' ? (embedded ? 'Profile & Background' : 'Agent Knowledge') : 'Agent Setup'}
            <Sparkles size={20} className="text-[#f46530]" />
          </h1>
          <p className={`${embedded ? 'text-sm' : 'text-base'} text-gray-400`}>
            {section === 'visual'
              ? 'Customize the appearance of your Qlynk Agent'
              : section === 'profile'
                ? `Teach your ${selectedAgentType.shortLabel.toLowerCase()} agent the context and knowledge it may use`
                : 'Manage your Qlynk Agent type, rules, status, access, and branding'}
          </p>
        </div>
            
            <div className="flex items-center gap-3">
              {username && (
                <a 
                  href={`/${username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-[#f46530]/50 hover:bg-gray-800 transition-all"
                >
                  <ExternalLink size={18} />
                  Preview
                </a>
              )}
              <button
                onClick={handleSaveDraft}
                disabled={saving || !hasContentChanges}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-200 rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
              >
                {saving && savingAction === 'draft' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving && savingAction === 'draft' ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!isDirty && !hasDraft)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#f46530] text-white rounded-xl font-semibold hover:bg-[#f46530]/90 shadow-lg shadow-[#f46530]/20 transition-all disabled:opacity-50"
              >
                {saving && savingAction === 'publish' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle size={18} />
                ) : saveStatus === 'error' ? (
                  <AlertCircle size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving && savingAction === 'publish' ? 'Publishing...' : saveStatus === 'error' ? 'Error' : 'Publish Changes'}
              </button>
            </div>
          </div>

          {(hasDraft || saveMessage) && section === 'general' && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              saveStatus === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-100'
            }`}>
              <span>
                {saveMessage || `Draft saved ${draftSavedAt ? new Date(draftSavedAt).toLocaleString() : ''}. Publish when you are ready for visitors to see it.`}
                {accessPassword && <span className="block text-xs text-gray-400 mt-1">Access passwords are applied only when you publish.</span>}
              </span>
              {hasDraft && (
                <button type="button" onClick={handleDiscardDraft} disabled={saving} className="shrink-0 text-xs font-bold text-gray-300 hover:text-white underline underline-offset-4 disabled:opacity-50">
                  Discard draft
                </button>
              )}
            </div>
          )}

          {section === 'general' && <>
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

          {/* Access Control */}
          {setupPanel === 'access' && (
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
          )}

          {/* Agent Branding */}
          {setupPanel === 'branding' && (
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
          )}

          </>}

          {section === 'visual' && <>
          {/* Visual Style Customization */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-pink-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-500/10 rounded flex items-center justify-center">
                <Palette size={18} className="text-pink-400" />
              </div>
              Visual Style
            </h2>
            <p className="text-sm text-gray-400 mb-6">Customize every color and font on your public chat page.</p>

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
                    <p className="text-white font-black text-lg mb-1">{config.agent_name || 'Your AI'}</p>
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
                    <p className="text-xs font-bold text-white mb-1">Welcome Page</p>
                    <p className="text-xs" style={{ color: config.gatekeeper_text_color || '#9ca3af' }}>
                      Please introduce yourself before chatting with {config.agent_name || 'Your AI'}.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">Preview updates live as you change settings</p>
              </div>
            </div>
          </div>

          </>}

          {section === 'profile' && <>
          {/* Bio & About */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-cyan-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center">
                <User size={18} className="text-cyan-400" />
              </div>
              {isPersonalAgent ? 'About You' : 'About This Agent'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                value={config.bio}
                onChange={(e) => updateConfig('bio', e.target.value)}
                placeholder="Tell visitors about yourself, your background, and what you do..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all resize-none"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-green-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center">
                <Briefcase size={18} className="text-green-400" />
              </div>
              {isPersonalAgent ? 'Skills & Expertise' : 'Capabilities & Key Topics'}
            </h2>
            
            {/* Existing skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {config.skills.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm group/skill"
                >
                  <span>{skill.name}{skill.level && ` (${skill.level})`}</span>
                  <button 
                    onClick={() => removeSkill(index)}
                    className="text-green-400/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new skill */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Skill name (e.g., React, Python)"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newSkill.level}
                onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                placeholder="Level (optional)"
                className="w-32 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-purple-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-purple-400" />
              </div>
              {isPersonalAgent ? 'Projects & Work' : 'Examples & Important Information'}
            </h2>
            
            {/* Existing projects */}
            <div className="space-y-3 mb-4">
              {config.projects.map((project, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-white">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-400">{project.description}</p>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink size={10} />
                        {project.url}
                      </a>
                    )}
                  </div>
                  <button 
                    onClick={() => removeProject(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new project */}
            <div className="space-y-3 p-4 bg-gray-900/30 rounded-xl border border-dashed border-gray-700/50">
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Short description"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newProject.url}
                  onChange={(e) => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Project URL (optional)"
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
                />
                <button
                  onClick={addProject}
                  className="px-4 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-amber-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center">
                <Mail size={18} className="text-amber-500" />
              </div>
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-amber-500/70" />
                  Email
                </label>
                <input
                  type="email"
                  value={config.contact_info.email || ''}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Phone size={14} className="text-amber-500/70" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={config.contact_info.phone || ''}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500/70" />
                  Location
                </label>
                <input
                  type="text"
                  value={config.contact_info.location || ''}
                  onChange={(e) => updateContactInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-amber-500/70" />
                  Website
                </label>
                <input
                  type="url"
                  value={config.contact_info.website || ''}
                  onChange={(e) => updateContactInfo('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500/70" />
                  Booking Link (Calendly, Cal.com, etc.)
                </label>
                <input
                  type="url"
                  value={config.contact_info.calendly || ''}
                  onChange={(e) => updateContactInfo('calendly', e.target.value)}
                  placeholder="https://calendly.com/yourname"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f46530]/10 rounded flex items-center justify-center">
                <Globe size={18} className="text-[#f46530]" />
              </div>
              Social Links
            </h2>
            
            {/* Existing social links */}
            <div className="space-y-2 mb-4">
              {config.social_links.map((link, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white capitalize">{link.platform}</span>
                    <span className="text-xs text-gray-400">{link.url}</span>
                  </div>
                  <button 
                    onClick={() => removeSocialLink(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new social link */}
            <div className="flex gap-3">
              <select
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                className="w-40 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Platform</option>
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="dribbble">Dribbble</option>
                <option value="behance">Behance</option>
                <option value="other">Other</option>
              </select>
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Profile URL"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSocialLink}
                className="px-4 py-2.5 bg-[#f46530]/10 text-[#f46530] border border-[#f46530]/20 rounded-xl hover:bg-[#f46530]/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Custom Knowledge */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-blue-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-blue-400" />
              </div>
              Custom Knowledge
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Add any additional information you want your agent to know. This could include FAQs, 
              detailed service descriptions, pricing info, or anything else visitors might ask about.
            </p>
            <textarea
              value={config.custom_knowledge}
              onChange={(e) => updateConfig('custom_knowledge', e.target.value)}
              placeholder="Enter any additional information for your agent..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all resize-none"
            />
          </div>

          </>}

          {section === 'general' && setupPanel === 'branding' && <>
          <AgentLaunchTools username={username} agentType={config.agent_type} agentName={config.agent_name} />
          </>}
        </div>
    );
}

export default AgentConfigPage;
