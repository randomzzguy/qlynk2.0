'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  FileText, 
  Globe, 
  MessageSquare, 
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  File,
  X,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createClientBrowser } from '@/lib/supabase';

export default function KnowledgeDashboard() {
  const [activeTab, setActiveTab] = useState('facts'); // 'facts' or 'documents'
  const [knowledge, setKnowledge] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Fact Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // File State
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClientBrowser();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch facts
      const { data: facts } = await supabase
        .from('agent_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch documents
      const { data: docs } = await supabase
        .from('agent_documents')
        .select('*')
        .order('created_at', { ascending: false });

      setKnowledge(facts || []);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load neural data');
    } finally {
      setLoading(false);
    }
  };

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

      toast.success('Neural fact saved');
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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Save record to Database
      const { error: dbError } = await supabase
        .from('agent_documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          is_processed: false // Will be updated by neural processor
        });

      if (dbError) throw dbError;

      toast.success('File uploaded to Neural Engine');
      fetchAllData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Neural sync failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFact = async (id) => {
    if (!confirm('Purge this neural fact?')) return;
    try {
      const { error } = await supabase.from('agent_knowledge').delete().eq('id', id);
      if (error) throw error;
      setKnowledge(knowledge.filter(k => k.id !== id));
      toast.success('Neural fact purged');
    } catch (error) {
      toast.error('Failed to purge');
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!confirm('Erase this neural document?')) return;
    try {
      // 1. Delete from storage
      await supabase.storage.from('agent-documents').remove([doc.storage_path]);
      // 2. Delete from DB
      await supabase.from('agent_documents').delete().eq('id', doc.id);
      
      setDocuments(documents.filter(d => d.id !== doc.id));
      toast.success('Document erased');
    } catch (error) {
      toast.error('Failed to erase');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/10" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Brain className="text-white w-9 h-9" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Neural Knowledge
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-gray-400 mt-1 font-medium text-sm md:text-base">Train your digital clone with multi-modal data.</p>
          </div>
        </div>

        <div className="relative z-10 flex p-1.5 bg-black/40 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('facts')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'facts' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Facts
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'documents' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Documents
          </button>
        </div>
      </div>

      {/* Main View */}
      <div className="min-h-[400px]">
        {activeTab === 'facts' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-blue-500" size={20} />
                Neural Facts
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
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Neural Fact'}
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
              ) : knowledge.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <p className="text-gray-500">No manual facts yet. Add one to boost your AI&apos;s intelligence.</p>
                </div>
              ) : (
                knowledge.map((item) => (
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
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <File className="text-purple-500" size={20} />
                Neural Documents
              </h2>
              <div className="relative">
                <input 
                  type="file" 
                  id="neural-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={uploading}
                />
                <label 
                  htmlFor="neural-upload"
                  className="flex items-center gap-2 text-sm font-bold bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl hover:bg-purple-500/30 transition-all cursor-pointer"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Neural Processing...' : 'Upload File'}
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
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload PDFs or Word docs to give your AI access to your resume, portfolio, or research.</p>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.is_processed ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                          {doc.is_processed ? 'Neural Sync Ready' : 'Processing...'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ${doc.is_processed ? 'w-full' : 'w-1/3 animate-pulse'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
