export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 200_000;

const ALLOWED_TYPES = {
  pdf: ['application/pdf', 'application/octet-stream'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
  txt: ['text/plain', 'application/octet-stream'],
};

export function getDocumentExtension(filename) {
  return String(filename || '').toLowerCase().split('.').pop();
}

export function validateDocumentFile(doc, fileData, buffer) {
  const extension = getDocumentExtension(doc.filename);
  if (!ALLOWED_TYPES[extension]) throw new Error('Unsupported document format');
  if (!Number.isFinite(doc.file_size) || doc.file_size <= 0 || doc.file_size > MAX_DOCUMENT_BYTES) {
    throw new Error('Document exceeds the allowed size');
  }
  if (buffer.length <= 0 || buffer.length > MAX_DOCUMENT_BYTES || buffer.length !== doc.file_size) {
    throw new Error('Stored document size does not match its record');
  }

  const contentType = String(fileData.type || doc.file_type || '').toLowerCase().split(';')[0];
  if (contentType && !ALLOWED_TYPES[extension].includes(contentType)) {
    throw new Error('Document content type does not match its format');
  }
  if (extension === 'pdf' && buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Invalid PDF signature');
  }
  if (extension === 'docx' && buffer.subarray(0, 2).toString('ascii') !== 'PK') {
    throw new Error('Invalid DOCX signature');
  }
  if (extension === 'txt' && buffer.includes(0)) {
    throw new Error('Plain-text document contains binary data');
  }
  return extension;
}

export function sanitizeExtractedText(text) {
  const sanitized = String(text || '').replace(/\u0000/g, '').trim().slice(0, MAX_EXTRACTED_CHARS);
  if (!sanitized) throw new Error('Document did not contain extractable text');
  return sanitized;
}
