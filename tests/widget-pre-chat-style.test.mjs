import test from 'node:test';
import assert from 'node:assert/strict';
import { PRE_CHAT_COLOR_FIELDS, resolvePreChatStyle, sanitizePreChatStyle } from '../lib/widget-pre-chat-style.js';
import { resolveWidgetTheme } from '../lib/widget-theme.js';
import { sanitizeWidgetInput } from '../lib/widget-installations.js';

test('pre-chat text remains readable when hosted-page text uses dark colors', () => {
  const theme = resolveWidgetTheme({ agent: {
    chat_bg_color: '#2a2728', heading_text_color: '#2a2728', gatekeeper_text_color: '#2a2728',
  } });
  const colors = resolvePreChatStyle({}, theme);
  assert.equal(colors.backgroundColor, '#2a2728');
  assert.equal(colors.headingColor, '#ffffff');
  assert.equal(colors.labelColor, '#e5e7eb');
  assert.equal(colors.introColor, '#cbd5e1');
  assert.equal(colors.inputTextColor, '#ffffff');
});

test('every pre-chat override survives widget save/reload and stays independent of general chat colors', () => {
  const style = Object.fromEntries(PRE_CHAT_COLOR_FIELDS.map(({ key }, i) => [key, `#${(0x102030 + i * 0x010101).toString(16)}`]));
  const saved = sanitizeWidgetInput({ name: 'Widget', pre_chat_style: style });
  assert.ifError(saved.error);
  const reloaded = JSON.parse(JSON.stringify(saved.value));
  const first = resolvePreChatStyle(reloaded.pre_chat_style, resolveWidgetTheme());
  const changedPage = resolvePreChatStyle(reloaded.pre_chat_style, resolveWidgetTheme({
    widget: { launcher_color: '#999999' },
    agent: { chat_bg_color: '#ffffff', cta_button_color: '#dddddd', cta_text_color: '#000000', heading_text_color: '#000000', gatekeeper_text_color: '#000000' },
  }));
  assert.deepEqual(first, style);
  assert.deepEqual(changedPage, style);
});

test('pre-chat style accepts alpha hex, drops unknown fields, and rejects invalid data', () => {
  assert.deepEqual(sanitizePreChatStyle({ inputBackgroundColor: ' #ffffff1a ', labelColor: '', unknown: 'not-stored' }), { value: { inputBackgroundColor: '#ffffff1a' } });
  assert.deepEqual(sanitizePreChatStyle(null), { value: {} });
  for (const value of [[], 'red', { labelColor: 'red' }, { inputTextColor: 123 }, { buttonColor: '#fff' }, { placeholderColor: '#123456789' }]) {
    assert.ok(sanitizePreChatStyle(value).error);
    assert.ok(sanitizeWidgetInput({ name: 'Widget', pre_chat_style: value }).error);
  }
});

test('a partially typed color does not discard other preview overrides', () => {
  const result = resolvePreChatStyle({ labelColor: '#', buttonColor: '#e45258' });
  assert.equal(result.labelColor, '#e5e7eb');
  assert.equal(result.buttonColor, '#e45258');
});
