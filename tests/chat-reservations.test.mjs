import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

let db;
before(async () => {
  db = await PGlite.create();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id UUID PRIMARY KEY);
    CREATE TABLE subscriptions(user_id UUID PRIMARY KEY, tier TEXT DEFAULT 'creator', status TEXT DEFAULT 'active',
      messages_used INTEGER DEFAULT 0, last_reset_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE agent_conversations(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), agent_owner_id UUID,
      visitor_id TEXT, visitor_name TEXT, visitor_email TEXT, channel TEXT, widget_installation_id UUID, source_origin TEXT);
    CREATE TABLE agent_messages(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id UUID REFERENCES agent_conversations ON DELETE CASCADE,
      role TEXT, content TEXT, created_at TIMESTAMPTZ DEFAULT now());
  `);
  for (const file of ['20261108010000_repair_monthly_message_quota.sql', '20261111010000_add_chat_credit_reservations.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
});
after(async () => { await db?.close(); });
async function fixture() {
  const owner = randomUUID();
  await db.query('INSERT INTO auth.users VALUES ($1)', [owner]);
  await db.query('INSERT INTO subscriptions(user_id) VALUES ($1)', [owner]);
  return { owner, request: randomUUID(), attempt: randomUUID(), visitor: randomUUID(), fingerprint: 'question-v1', limit: 5000, conversation: null };
}
const reserve = async r => (await db.query('SELECT reserve_agent_chat_request($1,$2,$3,$4,$5,$6,$7,$8,$9) AS result',
  [r.owner, r.request, r.attempt, r.visitor, r.fingerprint, 'Where are the towels?', r.limit, r.conversation, { channel: 'hosted' }])).rows[0].result;
const finish = async (r, answer = null) => (await db.query('SELECT finish_agent_chat_request($1,$2,$3,$4) AS result',
  [r.owner, r.request, r.attempt, answer])).rows[0].result;
const usage = async r => (await db.query('SELECT messages_used FROM subscriptions WHERE user_id=$1', [r.owner])).rows[0].messages_used;

test('failed replies refund exactly once and retries reuse their conversation', async () => {
  const r = await fixture();
  const first = await reserve(r);
  assert.equal(first.status, 'reserved');
  assert.equal(await usage(r), 1);
  assert.equal(await finish(r), true);
  assert.equal(await finish(r), false);
  assert.equal(await usage(r), 0);
  const retry = { ...r, attempt: randomUUID() };
  const second = await reserve(retry);
  assert.equal(second.conversation_id, first.conversation_id);
  assert.equal(second.new_conversation, false);
  assert.equal(await usage(r), 1);
  // A late failed attempt must not refund or complete its successor.
  assert.equal(await finish(r), false);
  assert.equal(await finish(r, 'Stale answer'), false);
  assert.equal(await usage(r), 1);
  assert.equal(await finish(retry, 'In the cupboard.'), true);
  assert.equal(await finish(retry), false);
  assert.equal(await finish(retry, 'In the cupboard.'), true);
  assert.equal(await usage(r), 1);
  const messages = (await db.query('SELECT role, content FROM agent_messages WHERE conversation_id=$1 ORDER BY created_at', [first.conversation_id])).rows;
  assert.deepEqual(messages, [{ role: 'user', content: 'Where are the towels?' }, { role: 'assistant', content: 'In the cupboard.' }]);
  assert.deepEqual(await reserve({ ...r, attempt: randomUUID() }), {
    status: 'completed', conversation_id: first.conversation_id, answer: 'In the cupboard.',
  });
  assert.equal(await usage(r), 1);
});

test('overlapping duplicate requests reserve only one credit and one conversation', async () => {
  const r = await fixture();
  const outcomes = await Promise.all(Array.from({ length: 20 }, () => reserve({ ...r, attempt: randomUUID() })));
  assert.equal(outcomes.filter(o => o.status === 'reserved').length, 1);
  assert.equal(outcomes.filter(o => o.status === 'pending').length, 19);
  assert.equal(new Set(outcomes.map(o => o.conversation_id)).size, 1);
  assert.equal(await usage(r), 1);
});

test('distinct requests cannot exceed the monthly cap', async () => {
  const r = await fixture();
  const outcomes = await Promise.all(Array.from({ length: 10 }, () => reserve({ ...r, request: randomUUID(), limit: 2 })));
  assert.equal(outcomes.filter(o => o.status === 'reserved').length, 2);
  assert.equal(outcomes.filter(o => o.status === 'limit').length, 8);
  assert.equal(await usage(r), 2);
});

test('expired attempts recover on the next reservation and cannot finalize late', async () => {
  const r = await fixture();
  await reserve(r);
  await db.query("UPDATE agent_chat_requests SET expires_at=now()-interval '1 second' WHERE owner_id=$1", [r.owner]);
  const retry = { ...r, attempt: randomUUID() };
  assert.equal((await reserve(retry)).status, 'reserved');
  assert.equal(await usage(r), 1);
  assert.equal(await finish(r, 'Late answer'), false);
  await finish(retry);
  assert.equal(await usage(r), 0);
});

test('refunds for an older month never subtract from the new month', async () => {
  const old = await fixture();
  await reserve(old);
  await db.query("UPDATE agent_chat_requests SET credit_month=date_trunc('month', now())-interval '1 month' WHERE owner_id=$1", [old.owner]);
  await db.query("UPDATE subscriptions SET last_reset_at=now()-interval '1 month' WHERE user_id=$1", [old.owner]);
  const current = { ...old, request: randomUUID(), attempt: randomUUID() };
  await reserve(current);
  assert.equal(await usage(old), 1);
  await finish(old);
  assert.equal(await usage(old), 1);
});

test('request identity and conversation ownership cannot be changed by a retry', async () => {
  const r = await fixture();
  const first = await reserve(r);
  for (const change of [{ visitor: randomUUID() }, { fingerprint: 'different' }, { conversation: randomUUID() }]) {
    assert.equal((await reserve({ ...r, ...change })).status, 'conflict');
  }
  const other = await fixture();
  assert.equal((await reserve({ ...other, conversation: first.conversation_id })).status, 'conflict');
  assert.equal(await usage(other), 0);
});

test('message persistence failures roll back settlement and can still be refunded', async () => {
  const r = await fixture();
  await reserve(r);
  await db.exec("ALTER TABLE agent_messages ADD CONSTRAINT reject_test_answer CHECK(content <> 'reject-me')");
  await assert.rejects(finish(r, 'reject-me'), /reject_test_answer/);
  const result = await db.query('SELECT count(*)::int AS count FROM agent_messages m JOIN agent_conversations c ON c.id=m.conversation_id WHERE c.agent_owner_id=$1', [r.owner]);
  assert.equal(result.rows[0].count, 0);
  assert.equal(await finish(r), true);
  assert.equal(await usage(r), 0);
});

test('reservation data and RPCs are server-only', async () => {
  for (const role of ['anon', 'authenticated']) {
    const result = await db.query(`SELECT
      has_table_privilege($1, 'agent_chat_requests', 'SELECT') AS readable,
      has_function_privilege($1, 'reserve_agent_chat_request(uuid,uuid,uuid,text,text,text,integer,uuid,jsonb)', 'EXECUTE') AS reservable,
      has_function_privilege($1, 'finish_agent_chat_request(uuid,uuid,uuid,text)', 'EXECUTE') AS refundable`, [role]);
    assert.deepEqual(result.rows[0], { readable: false, reservable: false, refundable: false });
  }
});
