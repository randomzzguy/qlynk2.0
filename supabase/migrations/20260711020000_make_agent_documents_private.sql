-- Existing projects may already have this bucket marked public. Object access
-- must go through the owner policies or the server-side service-role client.
UPDATE storage.buckets
SET public = false
WHERE id = 'agent-documents';
