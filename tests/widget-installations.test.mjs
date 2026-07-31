import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWidgetEmbedCode,
  isOriginAllowed,
  isWidgetId,
  normalizeAllowedOrigins,
  normalizeWidgetOrigin,
  sanitizeWidgetInput,
} from '../lib/widget-installations.js';

const widgetId = '11111111-1111-4111-8111-111111111111';

test('widget origins normalize to exact http(s) origins and deduplicate', () => {
  assert.equal(normalizeWidgetOrigin('example.com/path'), 'https://example.com');
  assert.equal(normalizeWidgetOrigin('http://localhost:3000/demo'), 'http://localhost:3000');
  assert.equal(normalizeWidgetOrigin('javascript:alert(1)'), null);
  assert.equal(normalizeWidgetOrigin('https://user:pass@example.com'), null);

  assert.deepEqual(
    normalizeAllowedOrigins(['example.com', 'https://example.com/path', 'https://www.example.com']),
    { origins: ['https://example.com', 'https://www.example.com'] }
  );
});

test('origin allowlists default to any valid origin and otherwise require an exact match', () => {
  assert.equal(isOriginAllowed('https://client.example', []), true);
  assert.equal(isOriginAllowed('https://client.example/path', ['https://client.example']), true);
  assert.equal(isOriginAllowed('https://sub.client.example', ['https://client.example']), false);
  assert.equal(isOriginAllowed('not a URL', []), false);
});

test('widget configuration is bounded and safe', () => {
  const valid = sanitizeWidgetInput({
    name: 'Client support',
    is_enabled: true,
    allowed_origins: ['client.example'],
    position: 'bottom-left',
    launcher_color: '#F46530',
  });
  assert.deepEqual(valid.value, {
    name: 'Client support',
    is_enabled: true,
    allowed_origins: ['https://client.example'],
    position: 'bottom-left',
    launcher_color: '#F46530',
  });

  assert.match(sanitizeWidgetInput({ name: '', allowed_origins: [] }).error, /name/i);
  assert.match(sanitizeWidgetInput({ name: 'Widget', allowed_origins: [], launcher_color: 'orange' }).error, /hex/i);
  assert.match(
    sanitizeWidgetInput({ name: 'Widget', allowed_origins: Array.from({ length: 11 }, (_, index) => `site${index}.example`) }).error,
    /up to 10/i
  );
});

test('embed snippets use opaque widget ids rather than usernames', () => {
  assert.equal(isWidgetId(widgetId), true);
  assert.equal(isWidgetId('client-name'), false);
  assert.equal(
    buildWidgetEmbedCode('https://www.qlynk.site/', widgetId),
    `<script src="https://www.qlynk.site/qlynk-agent.js" data-widget-id="${widgetId}" async></script>`
  );
  assert.equal(buildWidgetEmbedCode('https://www.qlynk.site', 'client-name'), '');
});
