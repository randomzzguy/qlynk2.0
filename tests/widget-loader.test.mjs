import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const loaderSource = await readFile(new URL('../public/qlynk-agent.js', import.meta.url), 'utf8');
const nextConfigSource = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');

function runLoader({ bodyAvailable = true } = {}) {
  const iframeListeners = new Map();
  const windowListeners = new Map();
  const documentListeners = new Map();
  const postedMessages = [];
  const clearedTimers = [];
  let intervalCallback = null;
  let appendCount = 0;

  const contentWindow = {
    postMessage(data, targetOrigin) {
      postedMessages.push({ data, targetOrigin });
    },
  };
  const iframe = {
    style: {},
    isConnected: false,
    contentWindow,
    setAttribute() {},
    addEventListener(type, listener) {
      iframeListeners.set(type, listener);
    },
    remove() {
      this.isConnected = false;
    },
  };
  const script = {
    src: 'https://www.qlynk.site/qlynk-agent.js',
    getAttribute(name) {
      return name === 'data-widget-id' ? '11111111-1111-4111-8111-111111111111' : null;
    },
  };
  const body = {
    appendChild(node) {
      appendCount += 1;
      node.isConnected = true;
      iframeListeners.get('load')?.();
    },
  };
  const document = {
    body: bodyAvailable ? body : null,
    getElementsByTagName(name) {
      return name === 'script' ? [script] : [];
    },
    createElement(name) {
      assert.equal(name, 'iframe');
      return iframe;
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
  };
  const window = {
    location: { origin: 'https://client.example' },
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    setInterval(callback) {
      intervalCallback = callback;
      return 7;
    },
    clearInterval(timer) {
      clearedTimers.push(timer);
      intervalCallback = null;
    },
  };

  vm.runInNewContext(loaderSource, {
    document,
    window,
    console,
    encodeURIComponent,
  });

  return {
    iframe,
    contentWindow,
    document,
    body,
    postedMessages,
    clearedTimers,
    getAppendCount: () => appendCount,
    dispatchWindowMessage(data, origin = 'https://www.qlynk.site', source = contentWindow) {
      windowListeners.get('message')?.({ data, origin, source });
    },
    dispatchDomReady() {
      document.body = body;
      documentListeners.get('DOMContentLoaded')?.();
    },
    retry() {
      intervalCallback?.();
    },
  };
}

test('loader retries initialization when the hydrated widget announces readiness', () => {
  const harness = runLoader();

  assert.equal(harness.getAppendCount(), 1);
  assert.equal(harness.postedMessages[0].data.type, 'qlynk_widget_init');
  assert.equal(harness.postedMessages[0].targetOrigin, 'https://www.qlynk.site');

  harness.dispatchWindowMessage({ type: 'qlynk_widget_ready' });
  assert.equal(harness.postedMessages.length, 2);
  assert.equal(harness.postedMessages[1].data.type, 'qlynk_widget_init');
  assert.equal(harness.postedMessages[1].targetOrigin, 'https://www.qlynk.site');

  harness.dispatchWindowMessage({ type: 'qlynk_widget_initialized' });
  assert.deepEqual(harness.clearedTimers, [7]);
  harness.retry();
  assert.equal(harness.postedMessages.length, 2);
});

test('loader ignores handshake messages from the wrong origin or frame', () => {
  const harness = runLoader();

  harness.dispatchWindowMessage({ type: 'qlynk_widget_ready' }, 'https://attacker.example');
  harness.dispatchWindowMessage({ type: 'qlynk_widget_ready' }, 'https://www.qlynk.site', {});

  assert.equal(harness.postedMessages.length, 1);
  assert.deepEqual(harness.clearedTimers, []);
});

test('loader waits for document.body before mounting the iframe', () => {
  const harness = runLoader({ bodyAvailable: false });

  assert.equal(harness.getAppendCount(), 0);
  assert.equal(harness.postedMessages.length, 0);

  harness.dispatchDomReady();

  assert.equal(harness.getAppendCount(), 1);
  assert.equal(harness.postedMessages.length, 1);
});

test('widget announces readiness after registering its initialization listener', async () => {
  const widgetSource = await readFile(new URL('../components/ChatWidget.jsx', import.meta.url), 'utf8');
  const listenerIndex = widgetSource.indexOf("window.addEventListener('message', handleInit)");
  const readyIndex = widgetSource.indexOf("type: 'qlynk_widget_ready'");

  assert.notEqual(listenerIndex, -1);
  assert.notEqual(readyIndex, -1);
  assert.ok(listenerIndex < readyIndex);
  assert.match(widgetSource, /type: 'qlynk_widget_initialized'/);
});

test('embed route reuses its initial agent and subscription lookups', async () => {
  const embedSource = await readFile(new URL('../app/embed/[username]/page.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(embedSource, /isAgentLive/);
  assert.match(embedSource, /isSubscriptionLive\(subscription\)/);
  assert.match(embedSource, /ownerSubscription/);
  assert.match(embedSource, /publicSubscription/);
});

test('site CSP permits the same-origin widget iframe', () => {
  assert.match(nextConfigSource, /frame-src 'self'/);
});
