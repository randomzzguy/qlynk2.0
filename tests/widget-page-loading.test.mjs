import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';
import * as theme from '../lib/widget-theme.js';
import * as preChatStyle from '../lib/widget-pre-chat-style.js';
import * as installations from '../lib/widget-installations.js';
import * as plans from '../lib/plans.js';

test('Widget page renders its loading state before agent or subscription data is available', () => {
  const source = readFileSync(new URL('../app/dashboard/widget/page.jsx', import.meta.url), 'utf8');
  const { code } = swc.transformSync(source, {
    filename: 'widget-page.jsx',
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const require = createRequire(import.meta.url);
  // Framework navigation/provider wrappers are outside this test. The actual
  // page, React hooks, theme resolution and initial null state execute intact.
  const modules = {
    '@/lib/widget-theme': theme,
    '@/lib/widget-pre-chat-style': preChatStyle,
    '@/lib/widget-installations': installations,
    '@/lib/plans': plans,
    '@/lib/dashboard-page-ready': { useDashboardPageReady() {} },
    '@/components/agent-editor/ColorField': { default: () => null },
    '@/components/WidgetPreview': { default: () => null },
    '@/components/WidgetPreChatForm': { default: () => null },
    '@/components/UpgradePrompt': { default: () => null },
  };
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => modules[name] || require(name), compiled, compiled.exports,
  );
  const html = renderToStaticMarkup(React.createElement(compiled.exports.default));
  assert.match(html, /animate-spin/);
  assert.doesNotMatch(html, /Something went wrong/);
});
