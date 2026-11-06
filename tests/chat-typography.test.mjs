import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWelcomeMessage, chatFontFamily } from '../lib/chat-typography.js';

test('welcome contractions and possessives lose pasted whitespace and invisible separators', () => {
  assert.equal(normalizeWelcomeMessage("Hi! I’  m Zedd, Zencode’ s AI. Tell me what you’  re building."), "Hi! I’m Zedd, Zencode’s AI. Tell me what you’re building.");
  assert.equal(normalizeWelcomeMessage("We’\u200bve got what you’\u00a0ll need."), "We’ve got what you’ll need.");
  assert.equal(normalizeWelcomeMessage("That' s useful."), "That’s useful.");
});

test('welcome cleanup preserves quotes, paragraphs, and already correct copy', () => {
  const copy = "Hi! I'm Zedd.\n\nCall it ' whatever you like ' and ask me anything.";
  assert.equal(normalizeWelcomeMessage(copy), copy);
  assert.equal(normalizeWelcomeMessage(null), '');
});

test('every chat font includes a predictable sans-serif fallback', () => {
  assert.equal(chatFontFamily('DM Sans'), '"DM Sans", Arial, sans-serif');
  assert.equal(chatFontFamily(null), '"Inter", Arial, sans-serif');
  assert.doesNotMatch(chatFontFamily('bad";color:red'), /;/);
});
