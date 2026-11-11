import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import swc from 'next/dist/build/swc/index.js';
import { PGlite } from '@electric-sql/pglite';
import { assessResilience } from '../lib/resilience-monitor.js';
import { configuredBackupProject, assessBackupReadiness } from '../lib/backup-readiness.js';
import { authorizeCronRequest } from '../lib/cron-auth.js';

const now = Date.parse('2026-11-11T10:00:00Z');
const snapshot = () => ({ observed_at: new Date(now).toISOString(), database_bytes: 100,
  storage: { known_bytes: 100, unknown_objects: 0, objects: 1 }, expired_chat_reservations: 0, budgets: [] });
test('capacity thresholds warn at 80%, become critical at 95%, and respect configured plan sizes', () => {
  const data = snapshot(); data.database_bytes = 400_000_000;
  assert.equal(assessResilience(data, {}, now).status, 'warning');
  data.database_bytes = 475_000_000;
  assert.equal(assessResilience(data, {}, now).status, 'critical');
  assert.equal(assessResilience(data, { MONITOR_DATABASE_LIMIT_BYTES: '1000000000' }, now).status, 'ok');
  assert.throws(() => assessResilience(data, { MONITOR_DATABASE_LIMIT_BYTES: '-1' }, now));
});
test('unknown storage sizes, stalled credits, active cooldowns and quota pressure are visible', () => {
  const data = snapshot();
  data.storage.unknown_objects = 1; data.expired_chat_reservations = 2;
  data.budgets = [{ scope: 'org', model: 'openai/gpt-oss-20b', blocked_until: new Date(now+60000).toISOString(),
    requests_minute: 0, requests_day: 700, tokens_minute: 0, tokens_day: 0, active_requests: 0 }];
  const report = assessResilience(data, {}, now);
  assert.equal(report.status, 'warning');
  for (const name of ['storage_size_coverage', 'expired_chat_reservations', 'org/openai/gpt-oss-20b/requests_day', 'org/openai/gpt-oss-20b/cooldown']) {
    assert.equal(report.checks.find(c => c.name === name).status, 'warning');
  }
});
test('missing and stale measurements cannot produce a healthy report', () => {
  for (const data of [null, {}, { ...snapshot(), database_bytes: null }, { ...snapshot(), observed_at: 'invalid' }, { ...snapshot(), observed_at: new Date(now-600000).toISOString() }]) {
    assert.throws(() => assessResilience(data, {}, now));
  }
});
test('backup checks require a completed recent recovery point, not merely PITR enabled', () => {
  for (const payload of [{ pitr_enabled: true }, { backups: [{ status: 'FAILED', inserted_at: new Date(now-1000).toISOString() }] },
    { backups: [{ status: 'COMPLETED', inserted_at: new Date(now-72*3600000).toISOString() }] },
    { backups: [{ status: 'COMPLETED', inserted_at: new Date(now+3600000).toISOString() }] }]) {
    assert.equal(assessBackupReadiness(payload, { now }).status, 'not_ready');
  }
  const report = assessBackupReadiness({ backups: [{ status: 'COMPLETED', inserted_at: new Date(now-3600000).toISOString() }] }, { now });
  assert.equal(report.status, 'recovery_point_advertised');
  assert.equal(report.restoreDrillVerified, false);
  assert.equal(report.storageObjectsVerified, false);
  assert.equal(assessBackupReadiness({ pitr_enabled: true, physical_backup_data: {
    earliest_physical_backup_date_unix: now/1000-86400, latest_physical_backup_date_unix: now/1000-100,
  } }, { now }).status, 'recovery_point_advertised');
});
test('backup checks have no production default and reject a mismatched project', () => {
  assert.throws(() => configuredBackupProject({}), /no default/);
  const ref = 'a'.repeat(20);
  assert.equal(configuredBackupProject({ NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co` }), ref);
  assert.throws(() => configuredBackupProject({ NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`, SUPABASE_PROJECT_REF: 'b'.repeat(20) }), /does not match/);
  assert.throws(() => configuredBackupProject({ SUPABASE_PROJECT_REF: 'bad;command' }), /Invalid/);
});
test('SQL snapshot reports only aggregate metadata, handles missing sizes and denies browser access', async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA storage; CREATE TABLE storage.objects(metadata JSONB);
      INSERT INTO storage.objects VALUES ('{"size":123,"private":"hidden"}'), ('{}'), ('{"size":"bad"}');
      CREATE TABLE agent_chat_requests(status TEXT, expires_at TIMESTAMPTZ);
      INSERT INTO agent_chat_requests VALUES ('pending',now()-interval '5 minutes');
      CREATE TABLE ai_provider_budgets(scope TEXT, model TEXT, blocked_until TIMESTAMPTZ);
      CREATE TABLE ai_provider_requests(scope TEXT, model TEXT, estimated_tokens INT, started_at TIMESTAMPTZ, active_until TIMESTAMPTZ);`);
    await db.exec(readFileSync(new URL('../supabase/migrations/20261111040000_add_resilience_snapshot.sql', import.meta.url), 'utf8'));
    const result = (await db.query('SELECT get_resilience_snapshot() AS result')).rows[0].result;
    assert.deepEqual(result.storage, { known_bytes: 123, unknown_objects: 2, objects: 3 });
    assert.equal(result.expired_chat_reservations, 1);
    assert.doesNotMatch(JSON.stringify(result), /hidden|private/);
    for (const role of ['anon', 'authenticated']) {
      assert.equal((await db.query("SELECT has_function_privilege($1,'get_resilience_snapshot()','EXECUTE') AS ok", [role])).rows[0].ok, false);
    }
  } finally { await db.close(); }
});

test('protected endpoint rejects anonymous callers and returns 503 on missing metrics', async () => {
  const { code } = swc.transformSync(readFileSync(new URL('../app/api/health/resilience/route.js', import.meta.url), 'utf8'), {
    filename: 'resilience.js', jsc: { parser: { syntax: 'ecmascript' } }, module: { type: 'commonjs' },
  });
  let databaseCalls = 0;
  const modules = {
    '@/lib/cron-auth': { authorizeCronRequest }, '@/lib/resilience-monitor': { assessResilience },
    '@/utils/supabase/server': { createAdminClient: () => ({ rpc: () => {
      databaseCalls++; return { abortSignal: async () => ({ error: new Error('private database detail') }) };
    } }) },
  };
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => modules[name], compiled, compiled.exports);
  const original = process.env.CRON_SECRET; process.env.CRON_SECRET = 'test-secret';
  try {
    const anonymous = await compiled.exports.GET(new Request('https://example.test/api/health/resilience'));
    assert.equal(anonymous.status, 401); assert.equal(databaseCalls, 0);
    const response = await compiled.exports.GET(new Request('https://example.test/api/health/resilience', { headers: { Authorization: 'Bearer test-secret' } }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(await response.text(), /private database detail/);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original;
  }
});
