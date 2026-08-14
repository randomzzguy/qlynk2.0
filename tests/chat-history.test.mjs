import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('hosted and widget chats send only the new turn while the server restores trusted history', async () => {
  const [fullPageChat, chatWidget, route] = await Promise.all([
    readFile(new URL('../components/FullPageChat.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/ChatWidget.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/ai-chat/route.js', import.meta.url), 'utf8'),
  ]);

  for (const client of [fullPageChat, chatWidget]) {
    assert.match(client, /messages:\s*\[userMessage\]/);
    assert.doesNotMatch(client, /messages:\s*updatedMessages/);
  }

  assert.match(route, /\.limit\(MAX_HISTORY_MESSAGES - 1\)/);
  assert.match(route, /const latestMessage = sanitizedMessages\[sanitizedMessages\.length - 1\]/);
});
