import { ExternalLink, Loader2, Save, CheckCircle, AlertCircle, Palette, SlidersHorizontal, UserRound } from 'lucide-react';
import { PageHeader, DASHBOARD_BUTTON_PRIMARY, DASHBOARD_BUTTON_SECONDARY } from '@/components/dashboard/PageShell';

export default function AgentEditorHeader({
  embedded,
  section,
  selectedAgentType,
  username,
  isDirty,
  saving,
  hasDraft,
  hasContentChanges,
  savingAction,
  handleSaveDraft,
  handleSave,
  saveStatus,
  saveMessage,
  draftSavedAt,
  accessPassword,
  handleDiscardDraft
}) {
  const title = section === 'visual' ? 'Visual Style' : section === 'profile' ? (embedded ? 'Profile & Background' : 'Agent Knowledge') : 'Agent Setup';
  const description = section === 'visual'
    ? 'Customize the appearance of your Qlynk Agent'
    : section === 'profile'
      ? `Teach your ${selectedAgentType.shortLabel.toLowerCase()} agent the context and knowledge it may use`
      : 'Manage your Qlynk Agent type, rules, status, access, and branding';
  const icon = section === 'visual' ? Palette : section === 'profile' ? UserRound : SlidersHorizontal;

  const actions = (
    <>
      {username && (
        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`dashboard-save-secondary ${DASHBOARD_BUTTON_SECONDARY}`}
        >
          <ExternalLink size={16} />
          Preview
        </a>
      )}
      {(isDirty || saving || hasDraft) && (
        <div className="dashboard-save-bar flex items-center justify-end gap-2" aria-label="Unsaved agent changes">
          {(hasContentChanges || savingAction === 'draft') && (
            <button
              onClick={handleSaveDraft}
              disabled={saving || !hasContentChanges}
              className={DASHBOARD_BUTTON_SECONDARY}
            >
              {saving && savingAction === 'draft' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving && savingAction === 'draft' ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!isDirty && !hasDraft)}
            className={DASHBOARD_BUTTON_PRIMARY}
          >
            {saving && savingAction === 'publish' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle size={16} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving && savingAction === 'publish' ? 'Publishing...' : saveStatus === 'error' ? 'Error' : 'Publish Changes'}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {embedded ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center mb-7 gap-4">
          <div>
            <h2 className="text-xl font-black text-white mb-1">{title}</h2>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2.5">{actions}</div>
        </div>
      ) : (
        <PageHeader icon={icon} title={title} description={description} actions={actions} />
      )}

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
    </>
  );
}
