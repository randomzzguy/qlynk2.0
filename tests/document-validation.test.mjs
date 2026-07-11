import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_DOCUMENT_BYTES,
  MAX_EXTRACTED_CHARS,
  sanitizeExtractedText,
  validateDocumentFile,
} from '../lib/document-validation.js';

function doc(filename, file_type, buffer) {
  return { filename, file_type, file_size: buffer.length };
}

test('valid PDF, DOCX, and TXT signatures are accepted', () => {
  const pdf = Buffer.from('%PDF-valid');
  const docx = Buffer.from('PK-valid');
  const txt = Buffer.from('plain text');
  assert.equal(validateDocumentFile(doc('a.pdf', 'application/pdf', pdf), { type: 'application/pdf' }, pdf), 'pdf');
  assert.equal(validateDocumentFile(doc('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', docx), { type: '' }, docx), 'docx');
  assert.equal(validateDocumentFile(doc('a.txt', 'text/plain', txt), { type: 'text/plain' }, txt), 'txt');
});

test('legacy DOC, spoofed signatures, binary TXT, and MIME mismatches are rejected', () => {
  assert.throws(() => validateDocumentFile(doc('a.doc', 'application/msword', Buffer.from('data')), {}, Buffer.from('data')));
  assert.throws(() => validateDocumentFile(doc('a.pdf', 'application/pdf', Buffer.from('not pdf')), {}, Buffer.from('not pdf')));
  assert.throws(() => validateDocumentFile(doc('a.txt', 'text/plain', Buffer.from([1, 0, 2])), {}, Buffer.from([1, 0, 2])));
  const pdf = Buffer.from('%PDF-valid');
  assert.throws(() => validateDocumentFile(doc('a.pdf', 'image/png', pdf), { type: 'image/png' }, pdf));
});

test('record mismatch and oversized documents are rejected', () => {
  const data = Buffer.from('plain text');
  assert.throws(() => validateDocumentFile({ ...doc('a.txt', 'text/plain', data), file_size: data.length + 1 }, {}, data));
  const oversized = Buffer.alloc(MAX_DOCUMENT_BYTES + 1, 65);
  assert.throws(() => validateDocumentFile(doc('a.txt', 'text/plain', oversized), {}, oversized));
});

test('extracted text is cleaned, required, and capped', () => {
  assert.equal(sanitizeExtractedText('  hello\u0000 world  '), 'hello world');
  assert.throws(() => sanitizeExtractedText(' \u0000 '));
  assert.equal(sanitizeExtractedText('a'.repeat(MAX_EXTRACTED_CHARS + 10)).length, MAX_EXTRACTED_CHARS);
});
