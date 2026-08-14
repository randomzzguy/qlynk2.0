import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { DEFAULT_WIDGET_THEME, resolveWidgetTheme, WIDGET_SURFACE_SHADOW } from '../lib/widget-theme.js';

test('widget theme uses the installation accent and every live visual-style field', () => {
  assert.deepEqual(
    resolveWidgetTheme({
      widget: { launcher_color: '#123456' },
      agent: {
        primary_color: '#654321',
        chat_bg_color: '#101820',
        user_bubble_color: '#223344',
        ai_bubble_color: '#334455',
        cta_button_color: '#445566',
        cta_text_color: '#fefefe',
        gatekeeper_text_color: '#aabbcc',
        font_family: 'Poppins',
      },
    }),
    {
      accentColor: '#123456',
      chatBgColor: '#101820',
      userBubbleColor: '#223344',
      aiBubbleColor: '#334455',
      ctaButtonColor: '#445566',
      ctaTextColor: '#fefefe',
      gatekeeperTextColor: '#aabbcc',
      fontFamily: 'Poppins',
    },
  );
});

test('widget theme falls back consistently when optional colors are blank', () => {
  assert.deepEqual(resolveWidgetTheme(), DEFAULT_WIDGET_THEME);

  const branded = resolveWidgetTheme({
    widget: { launcher_color: '' },
    agent: { primary_color: '#abcdef', cta_button_color: '   ' },
  });
  assert.equal(branded.accentColor, '#abcdef');
  assert.equal(branded.ctaButtonColor, '#abcdef');
});

test('widget surface blends into its host without a colored outline', () => {
  assert.equal(
    WIDGET_SURFACE_SHADOW,
    '0 28px 80px rgba(0, 0, 0, 0.34), 0 10px 30px rgba(0, 0, 0, 0.18)',
  );
  assert.doesNotMatch(WIDGET_SURFACE_SHADOW, /#[0-9a-f]{3,8}/i);
});

test('dashboard preview and live widget share theme resolution and receive the same fields', async () => {
  const [previewSource, widgetSource, apiSource] = await Promise.all([
    readFile(new URL('../app/dashboard/widget/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/ChatWidget.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/widget-installations/route.js', import.meta.url), 'utf8'),
  ]);

  assert.match(previewSource, /resolveWidgetTheme/);
  assert.match(widgetSource, /resolveWidgetTheme/);
  assert.match(previewSource, /boxShadow: WIDGET_SURFACE_SHADOW/);
  assert.match(widgetSource, /boxShadow: WIDGET_SURFACE_SHADOW/);
  for (const field of [
    'chat_bg_color',
    'user_bubble_color',
    'ai_bubble_color',
    'cta_button_color',
    'cta_text_color',
    'gatekeeper_text_color',
    'font_family',
  ]) {
    assert.match(apiSource, new RegExp(field));
  }
});
