'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  FileText, 
  Globe, 
  MessageSquare, 
  Loader2,
  Upload,
  File,
  X,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';
import { AgentConfigPage } from '@/app/dashboard/agent/page';

export default function KnowledgeDashboard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'gaps' ? 'gaps' : 'profile');
  const [knowledge, setKnowledge] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // Fact Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Link Form
  const [newUrl, setNewUrl] = useState('');

  // FAQ Form
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqPriority, setNewFaqPriority] = useState(1);
  const [faqCategory, setFaqCategory] = useState('general');
  
  // File State
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [selectedGapId, setSelectedGapId] = useState(null);
  const [gapAnswer, setGapAnswer] = useState('');
  const hasUnsavedDraft = Boolean(
    newTitle.trim()
    || newContent.trim()
    || newUrl.trim()
    || newFaqQuestion.trim()
    || newFaqAnswer.trim()
  );

  const supabase = createClientBrowser();

  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch facts
      const { data: facts } = await supabase
        .from('agent_knowledge')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch documents
      const { data: docs } = await supabase
        .from('agent_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setKnowledge(facts || []);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load knowledge');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    setLoading(true);
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event) => {
      if (!hasUnsavedDraft) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [hasUnsavedDraft]);

  // Refresh every 5s while a document is still processing.
  useEffect(() => {
    const hasUnprocessed = documents.some(d => !d.is_processed && ['pending', 'processing'].includes(d.processing_status || 'pending'));
    if (hasUnprocessed) {
      const timer = setTimeout(() => {
        fetchAllData();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [documents, fetchAllData]);

  const handleAddFact = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('agent_knowledge')
        .insert({
          user_id: user.id,
          title: newTitle,
          content: newContent,
          source_type: 'text'
        });

      if (error) throw error;

      toast.success('Fact saved');
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast.error('Failed to add knowledge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`URL successfully indexed: ${data.title}`);
      setNewUrl('');
      setIsAddingLink(false);
      fetchAllData();
    } catch (error) {
      console.error('Error scraping website:', error);
      toast.error(error.message || 'Failed to index website content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 3MB Limit check
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File exceeds 3MB limit');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('agent-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Save record to Database
      const { data: dbData, error: dbError } = await supabase
        .from('agent_documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
          is_processed: false,
          processing_status: 'pending'
        })
        .select();

      if (dbError) throw dbError;
      
      const newDocId = dbData?.[0]?.id;

      // 3. Trigger document processing.
      if (newDocId) {
        // We don't await this so the UI stays responsive, but it starts immediately
        fetch('/api/process-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: newDocId })
        }).then(async (response) => {
          if (!response.ok) throw new Error('Document processing failed');
          fetchAllData();
        }).catch(err => {
          console.error('Processing trigger failed:', err);
          fetchAllData();
        });
      }

      toast.success('File uploaded and processing started');
      fetchAllData();
    } catch (error) {
      console.error('Upload error details:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFact = async (id) => {
    if (!confirm('Delete this fact?')) return;
    try {
      const { error } = await supabase.from('agent_knowledge').delete().eq('id', id);
      if (error) throw error;
      setKnowledge(knowledge.filter(k => k.id !== id));
      toast.success('Fact deleted');
    } catch {
      toast.error('Failed to purge');
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!confirm('Delete this document?')) return;
    try {
      // 1. Delete from storage
      await supabase.storage.from('agent-documents').remove([doc.storage_path]);
      // 2. Delete from DB
      await supabase.from('agent_documents').delete().eq('id', doc.id);
      
      setDocuments(documents.filter(d => d.id !== doc.id));
      toast.success('Document erased');
    } catch {
      toast.error('Failed to erase');
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newFaqQuestion || !newFaqAnswer) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('agent_knowledge')
        .insert({
          user_id: user.id,
          title: newFaqQuestion,
          content: newFaqAnswer,
          source_type: 'faq',
          priority: newFaqPriority,
          category: faqCategory,
        });

      if (insertError) throw insertError;

      toast.success('FAQ added successfully');
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      setNewFaqPriority(1);
      setFaqCategory('general');
      setIsAddingFaq(false);
      fetchAllData();
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast.error('Failed to add FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePriority = async (itemId, newPriority) => {
    try {
      const { error: updateError } = await supabase
        .from('agent_knowledge')
        .update({ priority: newPriority })
        .eq('id', itemId);

      if (updateError) throw updateError;

      setKnowledge(knowledge.map(k => k.id === itemId ? { ...k, priority: newPriority } : k));
      toast.success('Priority updated');
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const fetchKnowledgeGaps = useCallback(async () => {
    setGapsLoading(true);
    try {
      const response = await fetch('/api/agent/knowledge-gaps', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load knowledge gaps');
      setKnowledgeGaps(result.gaps || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGapsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'gaps') fetchKnowledgeGaps();
  }, [activeTab, fetchKnowledgeGaps]);

  const handleGapAction = async (gapId, action) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/agent/knowledge-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gapId, action, answer: action === 'resolve' ? gapAnswer : undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update this knowledge gap');
      toast.success(action === 'resolve' ? 'Approved answer added to FAQ' : action === 'dismiss' ? 'Question dismissed' : 'Question reopened');
      setSelectedGapId(null);
      setGapAnswer('');
      await Promise.all([fetchKnowledgeGaps(), action === 'resolve' ? fetchAllData() : Promise.resolve()]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] px-5 sm:px-7 lg:px-9 py-8 sm:py-10 space-y-7">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <Brain className="text-blue-300 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Knowledge Base</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">Organize the approved context and sources your agent can use.</p>
          </div>
        </div>

        <div className="flex flex-wrap p-1.5 bg-black/30 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Profile Context
          </button>
          <button 
            onClick={() => setActiveTab('facts')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'facts' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Facts
          </button>
          <button 
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'faq' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            FAQ
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'documents' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Documents
          </button>
          <button 
            onClick={() => setActiveTab('links')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'links' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Links
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'gaps' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Knowledge Gaps
            {knowledgeGaps.filter((gap) => gap.status === 'open').length > 0 && (
              <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${activeTab === 'gaps' ? 'bg-orange text-white' : 'bg-orange/15 text-orange'}`}>
                {knowledgeGaps.filter((gap) => gap.status === 'open').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main View */}
      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <AgentConfigPage sectionOverride="profile" embedded />
        )}

        {activeTab === 'facts' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-blue-500" size={20} />
                Facts
              </h2>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 text-sm font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-white"
              >
                {isAdding ? <X size={16} /> : <Plus size={16} />}
                {isAdding ? 'Close' : 'Add Fact'}
              </button>
            </div>

            {isAdding && (
              <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 p-8 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <form onSubmit={handleAddFact} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Title / Label</label>
                      <input 
                        type="text"
                        placeholder="e.g. My Career Goals"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Knowledge Content</label>
                      <textarea 
                        placeholder="Detailed info for the AI..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white h-48 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 resize-none"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Fact'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
              ) : knowledge.filter(k => k.source_type !== 'url').length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <p className="text-gray-500">No facts yet. Add approved information your agent should be able to reference.</p>
                </div>
              ) : (
                knowledge.filter(k => k.source_type !== 'url').map((item) => (
                  <div key={item.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                      <button onClick={() => handleDeleteFact(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{item.content}</p>
                    <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Text Block</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <File className="text-purple-500" size={20} />
                Documents
              </h2>
              <div className="relative">
                <input 
                  type="file" 
                  id="neural-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                  disabled={uploading}
                />
                <label 
                  htmlFor="neural-upload"
                  className="flex items-center gap-2 text-sm font-bold bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl hover:bg-purple-500/30 transition-all cursor-pointer"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Processing...' : 'Upload File'}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                </div>
              ) : documents.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-2">No documents uploaded</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload PDFs, Word files, or text documents containing approved information for your agent.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <FileText className="text-purple-400" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate mb-1">{doc.filename}</h3>
                        <p className="text-[10px] text-gray-500">{(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleDeleteDoc(doc)} className="text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Status</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.is_processed ? 'bg-green-500/10 text-green-400' : doc.processing_status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                          {doc.is_processed ? 'Ready' : doc.processing_status === 'failed' ? 'Processing failed' : 'Processing...'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ${doc.is_processed ? 'w-full' : doc.processing_status === 'failed' ? 'w-full bg-red-500' : 'w-1/3 animate-pulse'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="text-orange-500" size={20} />
                Web Links
              </h2>
              <button 
                onClick={() => setIsAddingLink(!isAddingLink)}
                className="flex items-center gap-2 text-sm font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-white"
              >
                {isAddingLink ? <X size={16} /> : <Plus size={16} />}
                {isAddingLink ? 'Close' : 'Scrape Link'}
              </button>
            </div>

            {isAddingLink && (
              <div className="bg-white/5 backdrop-blur-xl border border-orange-500/30 p-8 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <form onSubmit={handleAddLink} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Website URL</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text"
                        placeholder="https://example.com/about"
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-600"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        required
                      />
                      <button 
                        type="submit"
                        disabled={submitting}
                        className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sync & Index URL'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 ml-1">
                      Qlynk will index the public page content and add it as a source your agent can reference.
                    </p>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                </div>
              ) : knowledge.filter(k => k.source_type === 'url').length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <Globe size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-2">No public links indexed</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Paste a website link, blog post, or resume page to index it automatically.</p>
                </div>
              ) : (
                knowledge.filter(k => k.source_type === 'url').map((item) => {
                  let displayHost = '';
                  try {
                    displayHost = new URL(item.source_url).hostname;
                  } catch {
                    displayHost = item.source_url || 'Web Link';
                  }

                  return (
                    <div key={item.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 hover:border-orange-500/50 transition-all group relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                              <Globe className="text-orange-400" size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate max-w-[180px] sm:max-w-[220px]" title={item.title}>
                                {item.title}
                              </h3>
                              <a 
                                href={item.source_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] text-gray-500 hover:text-white transition-colors truncate max-w-[180px] sm:max-w-[220px] block"
                              >
                                {displayHost}
                              </a>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteFact(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-2 shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4">{item.content}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-full">Web Resource</span>
                        <span className="text-[10px] text-gray-600 font-medium">~{(item.content?.length || 0)} chars</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-emerald-500" size={20} />
                Frequently Asked Questions
                <span className="text-xs text-gray-500 font-normal ml-2">High priority FAQs appear first in responses</span>
              </h2>
              <button 
                onClick={() => setIsAddingFaq(!isAddingFaq)}
                className="flex items-center gap-2 text-sm font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-white"
              >
                {isAddingFaq ? <X size={16} /> : <Plus size={16} />}
                {isAddingFaq ? 'Close' : 'Add FAQ'}
              </button>
            </div>

            {isAddingFaq && (
              <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/30 p-8 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <form onSubmit={handleAddFaq} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Question</label>
                      <input 
                        type="text"
                        placeholder="e.g. What services do you offer?"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
                        value={newFaqQuestion}
                        onChange={(e) => setNewFaqQuestion(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Answer</label>
                      <textarea 
                        placeholder="Write the approved answer your agent should use..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white h-32 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600 resize-none"
                        value={newFaqAnswer}
                        onChange={(e) => setNewFaqAnswer(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                      <select
                        value={faqCategory}
                        onChange={(e) => setFaqCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        <option value="general">General</option>
                        <option value="pricing">Pricing & Plans</option>
                        <option value="services">Services</option>
                        <option value="contact">Contact & Availability</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Priority (1-5)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="1"
                          max="5"
                          value={newFaqPriority}
                          onChange={(e) => setNewFaqPriority(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-white font-bold w-8 text-center">{newFaqPriority}</span>
                      </div>
                      <p className="text-xs text-gray-500">Higher priority = AI references this first</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add FAQ'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
              ) : knowledge.filter(k => k.source_type === 'faq').length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <HelpCircle size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-2">No FAQs yet</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Add common questions and approved answers to improve your agent&apos;s accuracy.</p>
                </div>
              ) : (
                knowledge
                  .filter(k => k.source_type === 'faq')
                  .sort((a, b) => (b.priority || 1) - (a.priority || 1))
                  .map((item) => (
                    <div key={item.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">
                              {item.category || 'general'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
                        </div>
                        <button onClick={() => handleDeleteFact(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-2 shrink-0">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Priority:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                onClick={() => handleUpdatePriority(item.id, level)}
                                className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                                  (item.priority || 1) >= level
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-800 text-gray-600 hover:bg-gray-700'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-600">
                          {item.priority >= 4 ? 'High Priority' : item.priority >= 2 ? 'Medium Priority' : 'Low Priority'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'gaps' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lightbulb className="text-amber-400" size={20} /> Knowledge Gaps
                </h2>
                <p className="text-sm text-gray-400 mt-1">Questions are collected when your agent says it lacks enough approved information.</p>
              </div>
              <button onClick={fetchKnowledgeGaps} disabled={gapsLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50">
                <RotateCcw size={15} className={gapsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {gapsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-9 h-9 animate-spin text-amber-400" /></div>
            ) : knowledgeGaps.length === 0 ? (
              <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-bold mb-2">No knowledge gaps detected</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Keep testing your agent. Questions it cannot answer confidently will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {knowledgeGaps.map((gap) => (
                  <div key={gap.id} className={`rounded-2xl border p-5 ${gap.status === 'open' ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-white/10 bg-white/[0.035]'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${gap.status === 'open' ? 'bg-amber-500/15 text-amber-300' : gap.status === 'resolved' ? 'bg-green-500/15 text-green-300' : 'bg-gray-500/15 text-gray-400'}`}>{gap.status}</span>
                          <span className="text-xs text-gray-500">Asked {gap.occurrence_count} time{gap.occurrence_count === 1 ? '' : 's'}</span>
                        </div>
                        <h3 className="text-white font-bold leading-relaxed">{gap.question}</h3>
                        <p className="text-xs text-gray-500 mt-2">Last seen {new Date(gap.last_seen_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {gap.status === 'open' ? (
                          <>
                            <button onClick={() => { setSelectedGapId(gap.id); setGapAnswer(''); }} className="px-4 py-2 rounded-xl bg-orange text-white text-sm font-bold hover:bg-orange/90">Add Answer</button>
                            <button onClick={() => handleGapAction(gap.id, 'dismiss')} disabled={submitting} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-sm font-semibold hover:bg-white/10">Dismiss</button>
                          </>
                        ) : (
                          <button onClick={() => handleGapAction(gap.id, 'reopen')} disabled={submitting} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-sm font-semibold hover:bg-white/10">Reopen</button>
                        )}
                      </div>
                    </div>

                    {selectedGapId === gap.id && (
                      <div className="mt-5 pt-5 border-t border-white/10">
                        <label className="block text-sm font-semibold text-white mb-2">Approved answer</label>
                        <textarea value={gapAnswer} onChange={(event) => setGapAnswer(event.target.value)} rows={5} maxLength={8000} placeholder="Write the exact answer your agent should use..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange/50 resize-y" />
                        <div className="flex justify-end gap-2 mt-3">
                          <button onClick={() => { setSelectedGapId(null); setGapAnswer(''); }} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white">Cancel</button>
                          <button onClick={() => handleGapAction(gap.id, 'resolve')} disabled={submitting || !gapAnswer.trim()} className="px-5 py-2 rounded-xl bg-orange text-white text-sm font-bold disabled:opacity-50">{submitting ? 'Saving...' : 'Add to FAQ & Resolve'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
