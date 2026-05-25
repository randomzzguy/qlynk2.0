import { createAdminClient, createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createRequire } from 'module';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for large PDFs

export async function POST(req) {
  try {
    const { documentId } = await req.json();

    // Polyfill for pdf-parse browser-dep issues
    if (typeof global.DOMMatrix === 'undefined') {
      global.DOMMatrix = class DOMMatrix {};
    }
    if (typeof global.Path2D === 'undefined') {
      global.Path2D = class Path2D {};
    }

    const require = createRequire(import.meta.url);
    const pdf = require('pdf-parse');

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId is required' }), { status: 400 });
    }

    // Authenticate the requesting user
    const cookieStore = await cookies();
    const authClient = createClient(cookieStore);
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch the document record
    const { data: doc, error: fetchError } = await adminSupabase
      .from('agent_documents')
      .select('*')
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

    if (doc.filename.toLowerCase().endsWith('.pdf')) {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        extractedText = 'Error extracting text from PDF.';
      }
    } else if (doc.filename.toLowerCase().endsWith('.docx')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        extractedText = 'Error extracting text from DOCX.';
      }
    } else {
      // Treat as plain text
      extractedText = buffer.toString('utf-8');
    }

    // 5. Update the record
    const { error: updateError } = await adminSupabase
      .from('agent_documents')
      .update({
        extracted_text: extractedText,
        is_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating doc:', updateError);
      return new Response(JSON.stringify({ error: `Failed to update document status: ${updateError.message}` }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('[Process-Document] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
