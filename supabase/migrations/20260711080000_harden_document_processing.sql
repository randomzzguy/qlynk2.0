ALTER TABLE public.agent_documents
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error TEXT;

UPDATE public.agent_documents
SET processing_status = CASE WHEN is_processed THEN 'complete' ELSE 'pending' END
WHERE processing_status IS NULL OR processing_status = 'pending';

ALTER TABLE public.agent_documents
  DROP CONSTRAINT IF EXISTS agent_documents_processing_status_check,
  ADD CONSTRAINT agent_documents_processing_status_check
    CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed')),
  DROP CONSTRAINT IF EXISTS agent_documents_file_size_check,
  ADD CONSTRAINT agent_documents_file_size_check
    CHECK (file_size IS NOT NULL AND file_size > 0 AND file_size <= 3145728) NOT VALID,
  DROP CONSTRAINT IF EXISTS agent_documents_extracted_text_size_check,
  ADD CONSTRAINT agent_documents_extracted_text_size_check
    CHECK (extracted_text IS NULL OR char_length(extracted_text) <= 200000) NOT VALID;

-- Keep compatibility with an older application instance during a rolling
-- deployment: legacy processors set only is_processed=true.
CREATE OR REPLACE FUNCTION public.sync_agent_document_processing_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_processed IS TRUE THEN
    NEW.processing_status := 'complete';
    NEW.processing_error := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_agent_document_processing_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_agent_document_processing_status_trigger
ON public.agent_documents;
CREATE TRIGGER sync_agent_document_processing_status_trigger
BEFORE INSERT OR UPDATE OF is_processed ON public.agent_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_agent_document_processing_status();

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'agent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('pdf', 'docx', 'txt')
  AND COALESCE((metadata ->> 'size')::bigint, 0) > 0
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 3145728
);
