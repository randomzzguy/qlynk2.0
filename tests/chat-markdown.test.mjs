import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('all chat and conversation surfaces share the structured Markdown renderer', async () => {
  const [renderer, fullPageChat, widget, demo, conversations, analytics] = await Promise.all([
    readFile(new URL('../components/ChatMarkdown.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/FullPageChat.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/ChatWidget.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/HomepageAgentDemo.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/dashboard/conversations/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/dashboard/analytics/page.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(fullPageChat, /<ChatMarkdown content=/);
  assert.match(widget, /<ChatMarkdown content=\{text\} compact/);
  assert.match(demo, /<ChatMarkdown content=\{message\.content\} compact/);
  assert.match(conversations, /<ChatMarkdown content=\{msg\.content\} compact/);
  assert.match(analytics, /<ChatMarkdown content=\{msg\.content\} compact/);
  assert.match(renderer, /remarkPlugins=\{\[remarkGfm\]\}/);
  assert.match(renderer, /list-outside list-disc/);
  assert.match(renderer, /list-outside list-decimal/);
  assert.match(renderer, /overflow-x-auto/);
  assert.match(renderer, /noopener noreferrer/);
});
