-- Create agent_documents table for file uploads
CREATE TABLE IF NOT EXISTS public.agent_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT,
    extracted_text TEXT,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;

-- Owner management
CREATE POLICY "Users can manage their own documents" ON public.agent_documents
FOR ALL USING (auth.uid() = user_id);

-- Storage Bucket setup
-- Note: This requires manual creation of the 'agent-documents' bucket in Supabase dashboard
-- or using a SQL command if the extensions are enabled.
-- Most people create buckets via the UI, but we'll try to add a policy for it if it exists.
-- For now, we assume the bucket exists (as per the code in documents/page.jsx).
