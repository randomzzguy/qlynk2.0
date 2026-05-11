-- Setup agent-documents storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-documents', 'agent-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'agent-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'agent-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'agent-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
