import { Sparkles, ExternalLink, Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';

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
  return (
    <>
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
            
            <div className="flex items-center justify-end gap-3">
              {username && (
                <a 
                  href={`/${username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="dashboard-save-secondary flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-[#f46530]/50 hover:bg-gray-800 transition-all"
                >
                  <ExternalLink size={18} />
                  Preview
                </a>
              )}
            </div>
            {(isDirty || saving || hasDraft) && (
            <div className="dashboard-save-bar flex items-center justify-end gap-2" aria-label="Unsaved agent changes">
              {(hasContentChanges || savingAction === 'draft') && (
              <button
                onClick={handleSaveDraft}
                disabled={saving || !hasContentChanges}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-200 rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
              >
                {saving && savingAction === 'draft' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving && savingAction === 'draft' ? 'Saving...' : 'Save Draft'}
              </button>
              )}
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
            )}
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

    </>
  );
}
