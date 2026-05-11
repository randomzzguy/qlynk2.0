import { createAdminClient } from '@/utils/supabase/server';
import pdf from 'pdf-parse';

export const maxDuration = 60; // Allow 60 seconds for large PDFs

export async function POST(req) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId is required' }), { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch the document record
    const { data: doc, error: fetchError } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      console.error('Error fetching doc:', fetchError);
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    // 2. Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('agent-documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download file from storage' }), { status: 500 });
    }

    // 3. Extract text based on file type
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
    } else {
      // Treat as plain text
      extractedText = buffer.toString('utf-8');
    }

    // 4. Update the record
    const { error: updateError } = await supabase
      .from('agent_documents')
      .update({
        extracted_text: extractedText,
        is_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating doc:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update document status' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('[Process-Document] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
