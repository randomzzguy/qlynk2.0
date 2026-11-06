'use client';

import { useSearchParams } from 'next/navigation';
import UpgradePrompt from '@/components/UpgradePrompt';
import AgentLaunchTools from '@/components/AgentLaunchTools';
import AgentVisualSection from '@/components/agent-editor/AgentVisualSection';
import AgentProfileSection from '@/components/agent-editor/AgentProfileSection';
import AgentEditorHeader from '@/components/agent-editor/AgentEditorHeader';
import AgentGeneralSection from '@/components/agent-editor/AgentGeneralSection';
import useAgentConfig from '@/components/agent-editor/useAgentConfig';

export function AgentConfigPage({ sectionOverride = null, embedded = false }) {
  const searchParams = useSearchParams();
  const section = sectionOverride || searchParams.get('section') || 'general';
  const {
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
  } = useAgentConfig();

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

      <AgentEditorHeader
        embedded={embedded}
        section={section}
        selectedAgentType={selectedAgentType}
        username={username}
        isDirty={isDirty}
        saving={saving}
        hasDraft={hasDraft}
        hasContentChanges={hasContentChanges}
        savingAction={savingAction}
        handleSaveDraft={handleSaveDraft}
        handleSave={handleSave}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        draftSavedAt={draftSavedAt}
        accessPassword={accessPassword}
        handleDiscardDraft={handleDiscardDraft}
      />

      {section === 'general' && (
        <AgentGeneralSection
          config={config}
          updateConfig={updateConfig}
          setupPanel={setupPanel}
          setSetupPanel={setSetupPanel}
          handleAgentTypeChange={handleAgentTypeChange}
          agentRules={agentRules}
          setAgentRules={setAgentRules}
          promptVersion={promptVersion}
          ruleVersions={ruleVersions}
          securitySummary={securitySummary}
          restoreRuleVersion={restoreRuleVersion}
          restoringRules={restoringRules}
          accessPassword={accessPassword}
          setAccessPassword={setAccessPassword}
          passwordIsSet={passwordIsSet}
          avatarUploading={avatarUploading}
          handleAvatarUpload={handleAvatarUpload}
        />
      )}

      {section === 'visual' && (
        <AgentVisualSection config={config} updateConfig={updateConfig} avatarUploading={avatarUploading} handleAvatarUpload={handleAvatarUpload} />
      )}

      {section === 'profile' && (
        <AgentProfileSection
          config={config}
          updateConfig={updateConfig}
          isPersonalAgent={isPersonalAgent}
          newSkill={newSkill}
          setNewSkill={setNewSkill}
          addSkill={addSkill}
          removeSkill={removeSkill}
          newProject={newProject}
          setNewProject={setNewProject}
          addProject={addProject}
          removeProject={removeProject}
          updateContactInfo={updateContactInfo}
          newSocialLink={newSocialLink}
          setNewSocialLink={setNewSocialLink}
          addSocialLink={addSocialLink}
          removeSocialLink={removeSocialLink}
        />
      )}

      {section === 'general' && setupPanel === 'branding' && (
        <AgentLaunchTools username={username} agentType={config.agent_type} agentName={config.agent_name} />
      )}
    </div>
  );
}

export default AgentConfigPage;
