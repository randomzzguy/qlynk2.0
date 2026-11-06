import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';
import { resolvePreChatStyle } from '../lib/widget-pre-chat-style.js';

// Compile the shared JSX component with the project's existing compiler so
// assertions cover rendered controls rather than matching implementation text.
const source = readFileSync(new URL('../components/WidgetPreChatForm.jsx', import.meta.url), 'utf8');
const { code } = swc.transformSync(source, {
  filename: 'WidgetPreChatForm.jsx',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', code)(createRequire(import.meta.url), compiled, compiled.exports);
const Form = compiled.exports.default;
const render = (props = {}) => renderToStaticMarkup(React.createElement(Form, { colors: resolvePreChatStyle(), ...props }));
const input = (html, name) => [...html.matchAll(/<input\b[^>]*>/g)].map(([tag]) => tag).find((tag) => tag.includes(`name="${name}"`));

test('pre-chat form renders independent label, input, placeholder, introduction and button colors', () => {
  const html = render({ intro: 'Tell us about yourself.', colors: resolvePreChatStyle({
    headingColor: '#111111', introColor: '#222222', labelColor: '#333333',
    inputTextColor: '#444444', inputBackgroundColor: '#555555',
    placeholderColor: '#666666', inputBorderColor: '#777777',
    supportingTextColor: '#888888', buttonColor: '#999999', buttonTextColor: '#aaaaaa',
  }) });
  assert.match(html, /color:#111111[^>]*>Before we start/);
  assert.match(html, /color:#222222[^>]*>Tell us about yourself/);
  assert.match(html, /color:#333333[^>]*>Your name/);
  assert.match(input(html, 'name'), /background-color:#555555;color:#444444;border-color:#777777/);
  assert.match(input(html, 'name'), /--qlynk-pre-chat-placeholder:#666666/);
  assert.match(html, /color:#888888/);
  assert.match(html, /background-color:#999999;color:#aaaaaa[^>]*>Start chat/);
});

test('pre-chat form keeps required and hidden visitor fields accurate', () => {
  const optional = render();
  assert.match(input(optional, 'name'), /required=""/);
  assert.doesNotMatch(input(optional, 'email'), /required=/);
  assert.match(optional, /Email \(optional\)/);
  assert.match(input(render({ requireEmail: true }), 'email'), /required=""/);
  const restricted = render({ showEmail: false, requirePassword: true });
  assert.equal(input(restricted, 'email'), undefined);
  assert.match(input(restricted, 'password'), /type="password"/);
  assert.match(input(restricted, 'password'), /required=""/);
});

test('preview uses the same controls without allowing data entry or submission', () => {
  const html = render({ preview: true });
  assert.match(input(html, 'name'), /readOnly=""/);
  assert.match(input(html, 'email'), /readOnly=""/);
  assert.match(html, /<button[^>]*disabled=""/);
});
