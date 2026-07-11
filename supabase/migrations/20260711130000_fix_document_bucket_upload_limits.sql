-- storage.objects metadata is not populated early enough for a reliable INSERT
-- policy size check. Supabase Storage buckets provide native server-side limits
-- specifically for this purpose.

UPDATE storage.buckets
SET file_size_limit = 3145728,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]::text[]
WHERE id = 'agent-documents';

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'agent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('pdf', 'docx', 'txt')
);
