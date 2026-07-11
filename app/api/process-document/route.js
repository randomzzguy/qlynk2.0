import { createAdminClient, createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createRequire } from 'module';
import { sanitizeExtractedText, validateDocumentFile } from '@/lib/document-validation';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for large PDFs

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req) {
  let documentId = null;
  let adminSupabase = null;
  try {
    const body = await req.json();
    documentId = body?.documentId;

    // Polyfill for pdf-parse browser-dep issues
    if (typeof global.DOMMatrix === 'undefined') {
      global.DOMMatrix = class DOMMatrix {};
    }
    if (typeof global.Path2D === 'undefined') {
      global.Path2D = class Path2D {};
    }

    const require = createRequire(import.meta.url);
    const pdf = require('pdf-parse');

    if (!UUID_PATTERN.test(documentId || '')) {
      return new Response(JSON.stringify({ error: 'documentId is required' }), { status: 400 });
    }

    // Authenticate the requesting user
    const cookieStore = await cookies();
    const authClient = createClient(cookieStore);
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    adminSupabase = createAdminClient();

    // 1. Fetch the document record
    const { data: doc, error: fetchError } = await adminSupabase
      .from('agent_documents')
      .select('id, user_id, filename, file_type, file_size, storage_path, is_processed, processing_status')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      console.error('Error fetching doc:', fetchError);
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    // 2. Verify ownership
    if (doc.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    if (typeof doc.storage_path !== 'string' || !doc.storage_path.startsWith(`${user.id}/`)) {
      throw new Error('Document storage path does not belong to its owner');
    }

    if (doc.is_processed || doc.processing_status === 'complete') {
      if (doc.processing_status !== 'complete') {
        await adminSupabase
          .from('agent_documents')
          .update({ processing_status: 'complete', processing_error: null })
          .eq('id', documentId)
          .eq('user_id', user.id);
      }
      return Response.json({ success: true, status: 'complete' });
    }

    const { data: processingRows, error: processingError } = await adminSupabase
      .from('agent_documents')
      .update({ processing_status: 'processing', processing_error: null, is_processed: false })
      .eq('id', documentId)
      .eq('user_id', user.id)
      .in('processing_status', ['pending', 'failed'])
      .select('id');
    if (processingError) throw processingError;
    if (!processingRows?.length) {
      return Response.json({ success: true, status: 'processing' }, { status: 202 });
    }

    // 3. Download the file from storage
    const { data: fileData, error: downloadError } = await adminSupabase
      .storage
      .from('agent-documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download file from storage' }), { status: 500 });
    }

    // 4. Extract text based on file type
    let extractedText = '';
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const extension = validateDocumentFile(doc, fileData, buffer);

    if (extension === 'pdf') {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (extension === 'docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      extractedText = buffer.toString('utf-8');
    }

    extractedText = sanitizeExtractedText(extractedText);

    // 5. Update the record
    const { error: updateError } = await adminSupabase
      .from('agent_documents')
      .update({
        extracted_text: extractedText,
        is_processed: true,
        processing_status: 'complete',
        processing_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating doc:', updateError);
      return new Response(JSON.stringify({ error: `Failed to update document status: ${updateError.message}` }), { status: 500 });
    }

    return Response.json({ success: true, status: 'complete' });

  } catch (error) {
    console.error('[Process-Document] Fatal Error:', error);
    if (adminSupabase && documentId) {
      await adminSupabase
        .from('agent_documents')
        .update({
          is_processed: false,
          processing_status: 'failed',
          processing_error: 'This document could not be processed. Check its format and size, then try again.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('processing_status', 'processing');
    }
    return Response.json({ error: 'Document processing failed' }, { status: 500 });
  }
}
