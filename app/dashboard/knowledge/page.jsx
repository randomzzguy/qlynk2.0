'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
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
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function KnowledgeDashboard() {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledge(data || []);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
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

      toast.success('Knowledge added successfully!');
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      fetchKnowledge();
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast.error('Failed to add knowledge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this piece of knowledge?')) return;

    try {
      const { error } = await supabase
        .from('agent_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Knowledge removed');
      setKnowledge(knowledge.filter(k => k.id !== id));
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      toast.error('Failed to delete knowledge');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/10" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Brain className="text-white w-9 h-9" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Knowledge Brain
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-gray-400 mt-1 font-medium">Train your AI clone with custom facts and data.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="relative z-10 flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/10"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Knowledge</>}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Title</label>
                <input 
                  type="text"
                  placeholder="e.g. My Services, Work Experience, About Qlynk..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Content</label>
                <textarea 
                  placeholder="Paste the details here. The AI will use this to answer questions."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white h-48 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 resize-none"
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
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Neural Fact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : knowledge.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
              <FileText className="text-gray-600 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Your Brain is Empty</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Add some facts about yourself so your AI clone can start talking for you.
            </p>
          </div>
        ) : (
          knowledge.map((item) => (
            <div 
              key={item.id} 
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 hover:border-blue-500/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="text-blue-400 w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                {item.content}
              </p>
              
              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-white/5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full">
                  {item.source_type}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
