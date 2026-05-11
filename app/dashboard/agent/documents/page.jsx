'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import { 
  Upload, 
  FileText, 
  Trash2, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  File,
  FileType,
  X,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const loadDocuments = useCallback(async (uid) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);
      await loadDocuments(user.id);
      setLoading(false);
    };

    init();
  }, [router, loadDocuments]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    if (!userId) return;
    
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        console.warn(`Skipping unsupported file: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Max size is 3MB.`);
        continue;
      }

      try {
        setUploadProgress({ current: i + 1, total: files.length, filename: file.name });
        
        // For text files, read the content directly
        let extractedText = '';
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          extractedText = await file.text();
        }

        // Upload to Supabase storage
        const supabase = createClient();
        const filename = `${userId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('agent-documents')
          .upload(filename, file);

        if (uploadError) {
          // If bucket doesn't exist, just store metadata
          console.warn('Storage upload failed, storing metadata only:', uploadError);
        }

        // Store document metadata
        const { error: dbError } = await supabase
          .from('agent_documents')
          .insert({
            user_id: userId,
            filename: file.name,
            file_type: file.type || 'text/plain',
            file_size: file.size,
            storage_path: filename,
            extracted_text: extractedText || null,
            is_processed: !!extractedText,
          });

        if (dbError) {
          console.error('Error saving document:', dbError);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setUploading(false);
    setUploadProgress(null);
    await loadDocuments(userId);
  };

  const handleDelete = async (docId, storagePath) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const supabase = createClient();

    // Delete from storage
    try {
      await supabase.storage.from('agent-documents').remove([storagePath]);
    } catch (e) {
      console.warn('Could not delete from storage:', e);
    }

    // Delete from database
    const { error } = await supabase
      .from('agent_documents')
      .delete()
      .eq('id', docId);

    if (!error) {
      setDocuments(docs => docs.filter(d => d.id !== docId));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileType className="text-red-400" size={24} />;
    if (fileType?.includes('word')) return <FileText className="text-blue-400" size={24} />;
    return <File className="text-gray-400" size={24} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <UpgradePrompt />

      {/* Header */}
      <div className="mb-10">
        <Link 
          href="/dashboard/agent"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Agent Config
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              Knowledge Base
              <Sparkles size={20} className="text-[#f46530]" />
            </h1>
            <p className="text-lg text-gray-400">
              Upload documents to expand your agent&apos;s intelligence
            </p>
          </div>
        </div>
      </div>

          {/* Upload Area */}
          <div 
            className={`bg-gray-800/20 backdrop-blur-sm rounded-2xl border-2 border-dashed p-12 mb-8 text-center transition-all ${
              dragActive 
                ? 'border-[#f46530] bg-[#f46530]/5' 
                : 'border-gray-700/50 hover:border-[#f46530]/30 hover:bg-gray-800/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-[#f46530] animate-spin mx-auto" />
                <p className="text-white font-bold text-lg">
                  Uploading {uploadProgress?.filename}...
                </p>
                <div className="max-w-xs mx-auto bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#f46530] h-full transition-all duration-300" 
                    style={{ width: `${(uploadProgress?.current / uploadProgress?.total) * 100}%` }}
                  />
                </div>
                <p className="text-gray-500 text-sm">
                  File {uploadProgress?.current} of {uploadProgress?.total}
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700/50">
                  <Upload className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Drop files here or click to upload
                </h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                  Enhance your agent with knowledge from PDF, TXT, Markdown, or Word documents (Max 3MB per file)
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#f46530] text-white rounded-xl font-bold cursor-pointer hover:bg-[#f46530]/90 shadow-lg shadow-[#f46530]/20 transition-all">
                  <Upload size={18} />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {/* Documents List */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              Uploaded Documents
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{documents.length}</span>
            </h2>
            
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No documents uploaded yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Upload documents to give your agent more knowledge
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.file_type)}
                      <div>
                        <h4 className="font-medium text-white">{doc.filename}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          {doc.is_processed ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle size={14} />
                              Processed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500">
                              <AlertCircle size={14} />
                              Processing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.storage_path)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 mb-20">
            <h4 className="font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <AlertCircle size={18} />
              How documents work
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-400">Text files (.txt, .md) are processed immediately for instant knowledge</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-400">PDF and Word documents are parsed to extract searchable text</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-400">Your agent uses this context to provide accurate, specific answers</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-400">Large documents are automatically chunked to optimize response quality</p>
              </div>
            </div>
          </div>
        </div>
  );
}
