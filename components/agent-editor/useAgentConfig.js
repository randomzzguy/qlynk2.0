import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { DEFAULT_AGENT_TYPE, getAgentTypeDefinition } from '@/lib/agent-type-catalog';
import { DEFAULT_AGENT_RULES, normalizeAgentRules } from '@/lib/agent-rules';
import { getCurrentUser } from '@/lib/supabase';
import { useDashboardPageReady } from '@/lib/dashboard-page-ready';
import { createInitialAgentConfig } from './agent-editor-defaults';

export default function useAgentConfig() {
  const router = useRouter();
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
  const [config, setConfig] = useState(createInitialAgentConfig);

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
  useDashboardPageReady(loading);

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
        
        // These requests are independent; start them together to avoid a
        // multi-round-trip loading waterfall on this route.
        const [
          { data: profile },
          { data: existingConfig },
          passwordStatusResponse,
          rulesResponse,
          draftResponse,
        ] = await Promise.all([
          supabase.from('profiles').select('username').eq('id', user.id).single(),
          supabase.from('agent_configs').select('*').eq('user_id', user.id).single(),
          fetch('/api/agent/access-password', { cache: 'no-store' }),
          fetch('/api/agent/rules', { cache: 'no-store' }),
          fetch('/api/agent/draft', { cache: 'no-store' }),
        ]);
        
        if (profile) {
          setUsername(profile.username);
        }

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

        if (passwordStatusResponse.ok) {
          const passwordStatus = await passwordStatusResponse.json();
          setPasswordIsSet(Boolean(passwordStatus.passwordSet));
        }

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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { dirty: isDirty } }));
    return () => window.dispatchEvent(new CustomEvent('qlynk:unsaved-changes', { detail: { dirty: false } }));
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

  return {
    loading,
    saving,
    savingAction,
    saveStatus,
    saveMessage,
    hasDraft,
    draftSavedAt,
    username,
    avatarUploading,
    config,
    newSkill,
    setNewSkill,
    newProject,
    setNewProject,
    newSocialLink,
    setNewSocialLink,
    accessPassword,
    setAccessPassword,
    passwordIsSet,
    agentRules,
    setAgentRules,
    promptVersion,
    ruleVersions,
    securitySummary,
    restoringRules,
    setupPanel,
    setSetupPanel,
    hasContentChanges,
    isDirty,
    selectedAgentType,
    isPersonalAgent,
    handleSaveDraft,
    handleSave,
    handleDiscardDraft,
    handleAgentTypeChange,
    restoreRuleVersion,
    handleAvatarUpload,
    updateConfig,
    updateContactInfo,
    addSkill,
    removeSkill,
    addProject,
    removeProject,
    addSocialLink,
    removeSocialLink
  };
}
