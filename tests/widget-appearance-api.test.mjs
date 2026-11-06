import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import swc from 'next/dist/build/swc/index.js';
import * as installations from '../lib/widget-installations.js';
import * as styles from '../lib/widget-pre-chat-style.js';

const source = readFileSync(new URL('../app/api/widget-installations/route.js', import.meta.url), 'utf8');
const { code } = swc.transformSync(source, {
  filename: 'widget-route.js', jsc: { parser: { syntax: 'ecmascript' } }, module: { type: 'commonjs' },
});

function setup({ authorized = true, live = true } = {}) {
  const widget = { name: 'Website', launcher_color: '#123456', pre_chat_style: { labelColor: '#aabbcc' } };
  const writes = [];
  const admin = { from(table) {
    let update;
    const filters = [];
    const query = {
      select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
      update(value) { update = value; return query; },
      async maybeSingle() {
        if (table === 'agent_configs') return { data: { id: 'agent' } };
        if (table === 'subscriptions') return { data: { tier: 'creator' } };
        if (update) { writes.push({ update, filters }); Object.assign(widget, update); }
        return { data: widget };
      },
    };
    return query;
  } };
  const modules = {
    'next/headers': { cookies: async () => ({}) },
    '@/utils/supabase/server': {
      createClient: () => ({ auth: { getUser: async () => ({ data: { user: authorized ? { id: 'owner' } : null } }) } }),
      createAdminClient: () => admin,
    },
    '@/lib/plans': { isSubscriptionLive: () => live, getEffectiveTier: () => 'creator' },
    '@/lib/rate-limit': { rateLimitResponse: async () => null },
    '@/lib/widget-installations': installations,
    '@/lib/widget-pre-chat-style': styles,
  };
  const compiled = { exports: {} };
  const require = createRequire(import.meta.url);
  new Function('require', 'module', 'exports', code)((name) => modules[name] || require(name), compiled, compiled.exports);
  const request = (method, data) => new Request('http://localhost/api/widget-installations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { api: compiled.exports, widget, writes, request };
}

test('form appearance publish changes only colors and scopes the update to the owner', async () => {
  const { api, request, widget, writes } = setup();
  const response = await api.PATCH(request('PATCH', { pre_chat_style: { labelColor: '#112233' }, launcher_color: '#ff0000', owner_id: 'someone-else' }));
  assert.equal(response.status, 200);
  assert.equal(widget.launcher_color, '#123456');
  assert.deepEqual(widget.pre_chat_style, { labelColor: '#112233' });
  assert.deepEqual(writes[0].filters, [['owner_id', 'owner']]);
  assert.deepEqual(Object.keys(writes[0].update).sort(), ['pre_chat_style', 'updated_at']);
});

test('installation changes preserve separately published form colors when omitted', async () => {
  const { api, request, widget } = setup();
  const response = await api.PUT(request('PUT', { name: 'Updated website', launcher_color: '#ff0000' }));
  assert.equal(response.status, 200);
  assert.equal(widget.launcher_color, '#ff0000');
  assert.deepEqual(widget.pre_chat_style, { labelColor: '#aabbcc' });
});

test('appearance reset clears overrides explicitly', async () => {
  const { api, request, widget } = setup();
  assert.equal((await api.PATCH(request('PATCH', { pre_chat_style: {} }))).status, 200);
  assert.deepEqual(widget.pre_chat_style, {});
});

test('unauthorized, inactive and invalid appearance requests cannot write', async () => {
  for (const [options, body, status] of [
    [{ authorized: false }, { pre_chat_style: {} }, 401],
    [{ live: false }, { pre_chat_style: {} }, 403],
    [{}, {}, 400],
    [{}, { pre_chat_style: { labelColor: 'broken' } }, 400],
  ]) {
    const { api, request, writes } = setup(options);
    assert.equal((await api.PATCH(request('PATCH', body))).status, status);
    assert.deepEqual(writes, []);
  }
});
