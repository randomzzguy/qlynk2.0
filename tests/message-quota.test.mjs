import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { getCurrentMessagesUsed } from '../lib/plans.js';

const owner = number => `10000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const migration = await readFile(new URL('../supabase/migrations/20261108010000_repair_monthly_message_quota.sql', import.meta.url), 'utf8');
let db;
const subscription = async number => (await db.query('SELECT * FROM subscriptions WHERE user_id = $1', [owner(number)])).rows[0];
const consume = async (number, limit = 5000) => (await db.query('SELECT * FROM consume_agent_message_credit($1, $2)', [owner(number), limit])).rows[0];

before(async () => {
  db = await PGlite.create();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE TABLE subscriptions (
      user_id UUID PRIMARY KEY, tier TEXT DEFAULT 'creator', status TEXT DEFAULT 'active',
      messages_used INTEGER DEFAULT 0, last_reset_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now(), stripe_subscription_id TEXT
    );
    CREATE TABLE agent_conversations (id UUID PRIMARY KEY, agent_owner_id UUID);
    CREATE TABLE agent_messages (conversation_id UUID, role TEXT, created_at TIMESTAMPTZ);
  `);
  const historical = await readFile(new URL('../supabase/migrations/20260718010000_add_safe_agent_types_and_rules.sql', import.meta.url), 'utf8');
  await db.exec(historical.slice(historical.indexOf('CREATE OR REPLACE FUNCTION public.consume_agent_message_credit(')));
  await db.query(`INSERT INTO subscriptions (user_id, messages_used, last_reset_at, created_at)
    VALUES ($1, 26, now() - interval '2 months', now() - interval '2 months'),
           ($2, 9, now(), now() - interval '2 months'),
           ($3, 5000, now() - interval '2 months', now() - interval '2 months')`, [owner(1), owner(2), owner(3)]);
  await db.query(`INSERT INTO agent_conversations VALUES ($1, $1), ($2, $2)`, [owner(1), owner(2)]);
  await db.query(`INSERT INTO agent_messages (conversation_id, role, created_at)
    SELECT $1::uuid, 'user', now() FROM generate_series(1, 7)
    UNION ALL SELECT $1::uuid, 'assistant', now() FROM generate_series(1, 7)
    UNION ALL SELECT $1::uuid, 'user', now() - interval '2 months'
    UNION ALL SELECT $2::uuid, 'user', now()`, [owner(1), owner(2)]);

  // Reproduce the actual production mismatch before repairing it.
  const oldCredit = await consume(1);
  assert.equal(oldCredit.messages_used, 27);
  assert.equal(getCurrentMessagesUsed(await subscription(1)), 0);
  assert.equal((await consume(999)).messages_used, 5000);
  await db.exec(migration);
});

after(async () => { await db?.close(); });

test('repairs stale usage from this month’s visitor prompts and displays subsequent reservations', async () => {
  const repaired = await subscription(1);
  assert.equal(repaired.messages_used, 7);
  assert.equal(getCurrentMessagesUsed(repaired), 7);
  assert.deepEqual(await consume(1), { allowed: true, messages_used: 8, remaining: 4992 });
  assert.equal(getCurrentMessagesUsed(await subscription(1)), 8);
});

test('preserves current-period reservations and clears old usage for inactive agents', async () => {
  assert.equal((await subscription(2)).messages_used, 9);
  assert.equal(getCurrentMessagesUsed(await subscription(2)), 9);
  assert.equal((await subscription(3)).messages_used, 0);
  await db.exec(migration);
  assert.equal((await subscription(1)).messages_used, 8);
  assert.equal((await subscription(2)).messages_used, 9);
});

test('rolls over once then persists every credit, including a missing reset timestamp', async () => {
  await db.query(`INSERT INTO subscriptions (user_id, messages_used, last_reset_at, created_at)
    VALUES ($1, 5000, now() - interval '2 months', now() - interval '2 months'),
           ($2, 5000, NULL, NULL)`, [owner(4), owner(5)]);
  for (const number of [4, 5]) {
    assert.deepEqual(await consume(number), { allowed: true, messages_used: 1, remaining: 4999 });
    assert.deepEqual(await consume(number), { allowed: true, messages_used: 2, remaining: 4998 });
    assert.equal(getCurrentMessagesUsed(await subscription(number)), 2);
  }
});

test('enforces Creator and complimentary Agency caps and denies paused accounts', async () => {
  await db.query(`INSERT INTO subscriptions (user_id, tier, status, messages_used)
    VALUES ($1, 'creator', 'active', 4999), ($2, 'agency', 'active', 9999),
           ($3, 'agency', 'past_due', 5000), ($4, 'creator', 'paused', 0)`,
  [owner(6), owner(7), owner(8), owner(9)]);
  assert.deepEqual(await consume(6, 10000), { allowed: true, messages_used: 5000, remaining: 0 });
  assert.equal((await consume(6, 10000)).allowed, false);
  assert.deepEqual(await consume(7, 10000), { allowed: true, messages_used: 10000, remaining: 0 });
  assert.equal((await consume(7, 10000)).allowed, false);
  assert.equal((await consume(8, 10000)).allowed, false);
  assert.equal((await consume(9)).allowed, false);
  assert.equal((await subscription(9)).messages_used, 0);
});

test('rejects invalid limits, distinguishes the repaired RPC, and restricts quota writes', async () => {
  assert.deepEqual(await consume(999), { allowed: false, messages_used: 0, remaining: 0 });
  await assert.rejects(consume(1, 0), /Invalid message credit parameters/);
  for (const [role, expected] of [['anon', false], ['authenticated', false], ['service_role', true]]) {
    const result = await db.query(`SELECT has_function_privilege($1, 'public.consume_agent_message_credit(uuid,integer)', 'EXECUTE') AS allowed`, [role]);
    assert.equal(result.rows[0].allowed, expected);
  }
});
