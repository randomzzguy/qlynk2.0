import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { ChatProviderError } from '../lib/chat-provider.js';
import { estimateGroqTokens, fetchWithGroqQuota, getGroqBudget } from '../lib/groq-quota.js';

let db;
before(async () => {
  db = await PGlite.create();
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  await db.exec(await readFile(new URL('../supabase/migrations/20261111020000_add_shared_groq_budgets.sql', import.meta.url), 'utf8'));
  await db.exec(`CREATE TABLE agent_conversations(id UUID PRIMARY KEY, sentiment TEXT);
    CREATE TABLE agent_messages(conversation_id UUID REFERENCES agent_conversations(id), role TEXT, content TEXT, created_at TIMESTAMPTZ DEFAULT now());`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261111030000_add_ai_usage_and_sentiment_cadence.sql', import.meta.url), 'utf8'));
});
after(async () => { await db?.close(); });

const reserve = async overrides => (await db.query('SELECT reserve_ai_provider_budget($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS result', [
  overrides.scope, overrides.model || 'model', overrides.id || randomUUID(), overrides.tokens ?? 100,
  overrides.rpm ?? 24, overrides.rpd ?? 800, overrides.tpm ?? 6400, overrides.tpd ?? 160000,
  overrides.concurrency ?? 3, overrides.background ?? false,
])).rows[0].result;
const finish = id => db.query('SELECT finish_ai_provider_request($1)', [id]);
const client = { async rpc(name, args) {
  if (name === 'complete_ai_provider_request') {
    await db.query('SELECT complete_ai_provider_request($1,$2,$3)', [args.p_request_id, args.p_workload, args.p_usage]);
    return { data: null };
  }
  if (name === 'reserve_ai_provider_budget') return { data: await reserve(Object.fromEntries(Object.entries(args).map(([k, v]) => [k.replace('p_', '').replace('request_id', 'id'), v]))) };
  if (name === 'finish_ai_provider_request') { await finish(args.p_request_id); return { data: null }; }
  if (name === 'cooldown_ai_provider_budget') {
    await db.query('SELECT cooldown_ai_provider_budget($1,$2,$3)', [args.p_scope, args.p_model, args.p_seconds]);
    return { data: null };
  }
  throw new Error(`Unexpected RPC ${name}`);
} };
const body = { model: 'openai/gpt-oss-120b', messages: [{ role: 'user', content: 'Hello' }], max_completion_tokens: 100 };

test('50 overlapping admissions share a concurrency cap, including across API keys', async () => {
  const scope = randomUUID();
  let sent = 0;
  const responses = await Promise.allSettled(Array.from({ length: 50 }, (_, index) => fetchWithGroqQuota(body, {
    client, scope, env: {}, apiKey: `key-${index}`, fetchProvider: async () => { sent++; return new Response('answer'); },
  })));
  assert.equal(sent, 3);
  assert.equal(responses.filter(r => r.status === 'rejected').length, 47);
  for (const result of responses) {
    if (result.status === 'fulfilled') await result.value.text();
    else assert.equal(result.reason.code, 'AI_RATE_LIMITED');
  }
  assert.equal((await reserve({ scope, model: body.model })).allowed, true);
});

test('minute tokens and request counts remain spent after a call finishes', async () => {
  for (const limits of [{ rpm: 2 }, { tpm: 200 }]) {
    const scope = randomUUID();
    for (let i = 0; i < 2; i++) {
      const id = randomUUID();
      assert.equal((await reserve({ scope, id, ...limits })).allowed, true);
      await finish(id);
    }
    assert.equal((await reserve({ scope, ...limits })).allowed, false);
    await db.query("UPDATE ai_provider_requests SET started_at=clock_timestamp()-interval '61 seconds' WHERE scope=$1", [scope]);
    assert.equal((await reserve({ scope, ...limits })).allowed, true);
  }
});

test('daily counts and tokens survive minute rollover and expire after 24 hours', async () => {
  for (const limits of [{ rpd: 1 }, { tpd: 100 }]) {
    const scope = randomUUID(); const id = randomUUID();
    assert.equal((await reserve({ scope, id, ...limits })).allowed, true);
    await finish(id);
    await db.query("UPDATE ai_provider_requests SET started_at=clock_timestamp()-interval '2 minutes' WHERE scope=$1", [scope]);
    assert.equal((await reserve({ scope, ...limits })).allowed, false);
    await db.query("UPDATE ai_provider_requests SET started_at=clock_timestamp()-interval '25 hours' WHERE scope=$1", [scope]);
    assert.equal((await reserve({ scope, ...limits })).allowed, true);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM ai_provider_requests WHERE scope=$1', [scope])).rows[0].n, 1);
  }
});

test('background work leaves foreground capacity and does not join an active call', async () => {
  const scope = randomUUID(); const id = randomUUID();
  await reserve({ scope, id, tokens: 300, tpm: 500 });
  assert.equal((await reserve({ scope, tokens: 10, background: true, tpm: 500 })).allowed, false);
  await finish(id);
  assert.equal((await reserve({ scope, tokens: 101, background: true, tpm: 500 })).allowed, false);
  assert.equal((await reserve({ scope, tokens: 101, tpm: 500 })).allowed, true);
});

test('provider 429 shares a cooldown without releasing spent token/request budgets', async () => {
  const scope = randomUUID();
  let sent = 0;
  const fetchProvider = async () => { sent++; throw new ChatProviderError('AI_RATE_LIMITED', 120); };
  await assert.rejects(fetchWithGroqQuota(body, { client, env: {}, scope, fetchProvider }), { code: 'AI_RATE_LIMITED' });
  await assert.rejects(fetchWithGroqQuota(body, { client, env: {}, scope, fetchProvider }), { code: 'AI_RATE_LIMITED' });
  assert.equal(sent, 1);
  await db.query('SELECT cooldown_ai_provider_budget($1,$2,1)', [scope, body.model]);
  const cooldown = await reserve({ scope, model: body.model });
  assert.equal(cooldown.reason, 'cooldown');
  assert.ok(cooldown.retry_after > 110);
  const row = (await db.query('SELECT count(*)::int AS n FROM ai_provider_requests WHERE scope=$1', [scope])).rows[0];
  assert.equal(row.n, 1);
});

test('leases recover crashed calls and duplicate admission IDs cannot replay a provider call', async () => {
  const scope = randomUUID(); const id = randomUUID();
  await reserve({ scope, id, concurrency: 1 });
  assert.equal((await reserve({ scope, id, concurrency: 1 })).reason, 'duplicate');
  assert.equal((await reserve({ scope, concurrency: 1 })).allowed, false);
  await db.query("UPDATE ai_provider_requests SET active_until='epoch' WHERE id=$1", [id]);
  assert.equal((await reserve({ scope, concurrency: 1 })).allowed, true);
});

test('budget-store failures and oversized requests never reach Groq', async () => {
  let sent = 0;
  const fetchProvider = async () => { sent++; return new Response('unexpected'); };
  await assert.rejects(fetchWithGroqQuota(body, { env: {}, client: { rpc: async () => ({ error: new Error('DB down') }) }, fetchProvider }), { code: 'AI_UNAVAILABLE' });
  await assert.rejects(fetchWithGroqQuota({ ...body, max_completion_tokens: 9000 }, { env: {}, client, scope: randomUUID(), fetchProvider }), { code: 'AI_REQUEST_TOO_LARGE' });
  assert.equal(sent, 0);
});

test('stream cancellation and stream errors release concurrency slots', async () => {
  for (const fail of [false, true]) {
    const scope = randomUUID();
    const response = await fetchWithGroqQuota(body, {
      env: {}, client, scope,
      fetchProvider: async () => new Response(new ReadableStream({ pull(controller) {
        if (fail) controller.error(new Error('broken stream'));
        else controller.enqueue(new TextEncoder().encode('partial'));
      } })),
    });
    if (fail) await assert.rejects(response.text(), /broken stream/);
    else await response.body.cancel();
    const active = (await db.query('SELECT count(*)::int AS n FROM ai_provider_requests WHERE scope=$1 AND active_until>clock_timestamp()', [scope])).rows[0].n;
    assert.equal(active, 0);
  }
});

test('token estimates include context and output; unknown or malformed budgets fail configuration', () => {
  assert.ok(estimateGroqTokens({ ...body, messages: [...body.messages, { role: 'system', content: 'x'.repeat(3000) }] }) >= estimateGroqTokens(body) + 1000);
  assert.equal(estimateGroqTokens({ ...body, max_completion_tokens: 200 }) - estimateGroqTokens(body), 100);
  assert.throws(() => estimateGroqTokens({ model: body.model }), /token limit/);
  assert.throws(() => getGroqBudget('unknown', {}), /Configure/);
  assert.throws(() => getGroqBudget(body.model, { GROQ_QUOTA_LIMITS_JSON: 'invalid' }));
  assert.throws(() => getGroqBudget(body.model, { GROQ_QUOTA_LIMITS_JSON: JSON.stringify({ [body.model]: { rpm: -1 } }) }));
});

test('quota tables and mutation RPCs are inaccessible to browsers', async () => {
  for (const role of ['anon', 'authenticated']) {
    const row = (await db.query(`SELECT
      has_table_privilege($1,'ai_provider_requests','SELECT') AS readable,
      has_table_privilege($1,'ai_provider_budgets','UPDATE') AS writable,
      has_function_privilege($1,'reserve_ai_provider_budget(text,text,uuid,integer,integer,integer,integer,integer,integer,boolean)','EXECUTE') AS reservable,
      has_function_privilege($1,'finish_ai_provider_request(uuid)','EXECUTE') AS finishable,
      has_function_privilege($1,'cooldown_ai_provider_budget(text,text,integer)','EXECUTE') AS blockable`, [role])).rows[0];
    assert.deepEqual(row, { readable: false, writable: false, reservable: false, finishable: false, blockable: false });
  }
});

test('streamed and JSON provider usage is measured without lowering admission estimates', async () => {
  const usage = { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, prompt_tokens_details: { cached_tokens: 40 } };
  for (const streaming of [false, true]) {
    const scope = randomUUID();
    const payload = streaming ? `data: ${JSON.stringify({ x_groq: { usage } })}\n\ndata: [DONE]\n\n` : JSON.stringify({ usage });
    const response = await fetchWithGroqQuota({ ...body, stream: streaming }, {
      client, scope, env: {}, workload: 'chat', fetchProvider: async () => new Response(payload),
    });
    assert.equal(await response.text(), payload);
    const row = (await db.query('SELECT * FROM ai_provider_requests WHERE scope=$1', [scope])).rows[0];
    assert.equal(row.prompt_tokens, 100);
    assert.equal(row.completion_tokens, 20);
    assert.equal(row.cached_tokens, 40);
    assert.equal(row.workload, 'chat');
    assert.equal(row.estimated_tokens, estimateGroqTokens({ ...body, stream: streaming }));
    await db.query('SELECT complete_ai_provider_request($1,$2,$3)', [row.id, 'chat', { prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0 }]);
    assert.equal((await db.query('SELECT prompt_tokens FROM ai_provider_requests WHERE id=$1', [row.id])).rows[0].prompt_tokens, 100);
    const summary = (await db.query('SELECT * FROM get_ai_usage_summary() WHERE scope=$1', [scope])).rows[0];
    assert.equal(Number(summary.measured_requests), 1);
    assert.equal(Number(summary.prompt_tokens), 100);
  }
});

test('missing usage stays explicitly unmeasured and does not break responses', async () => {
  const scope = randomUUID();
  const response = await fetchWithGroqQuota(body, { client, env: {}, scope, fetchProvider: async () => new Response('no usage') });
  assert.equal(await response.text(), 'no usage');
  const row = (await db.query('SELECT * FROM get_ai_usage_summary() WHERE scope=$1', [scope])).rows[0];
  assert.equal(Number(row.requests), 1);
  assert.equal(Number(row.measured_requests), 0);
  assert.equal(Number(row.measured_estimated_tokens), 0);
});

test('sentiment claims require three messages, then five new messages and a cooldown', async () => {
  const conversation = randomUUID();
  await db.query('INSERT INTO agent_conversations(id) VALUES($1)', [conversation]);
  const addMessages = count => db.query("INSERT INTO agent_messages(conversation_id,role,content) SELECT $1,'user','Hi' FROM generate_series(1,$2::int)", [conversation, count]);
  const claim = async id => (await db.query('SELECT claim_agent_sentiment_check($1,$2) AS ok', [conversation,id])).rows[0].ok;
  const finishClaim = async id => (await db.query("SELECT finish_agent_sentiment_check($1,$2,'positive') AS ok", [conversation,id])).rows[0].ok;
  await addMessages(2);
  assert.equal(await claim(randomUUID()), false);
  await addMessages(1);
  const id = randomUUID();
  assert.equal(await claim(id), true);
  assert.equal(await claim(randomUUID()), false);
  assert.equal(await finishClaim(id), true);
  assert.equal(await finishClaim(id), false);
  await addMessages(5);
  assert.equal(await claim(randomUUID()), false);
  await db.query("UPDATE agent_sentiment_checks SET last_attempt_at=now()-interval '6 minutes' WHERE conversation_id=$1", [conversation]);
  const next = randomUUID();
  assert.equal(await claim(next), true);
  assert.equal(await finishClaim(id), false);
  assert.equal(await finishClaim(next), true);
  await db.query("UPDATE agent_sentiment_checks SET last_attempt_at=now()-interval '6 minutes' WHERE conversation_id=$1", [conversation]);
  await addMessages(4);
  assert.equal(await claim(randomUUID()), false);
});

test('sentiment concurrent claims and failed-job cooldown prevent duplicate analysis', async () => {
  const conversation = randomUUID();
  await db.query('INSERT INTO agent_conversations(id) VALUES($1)', [conversation]);
  await db.query("INSERT INTO agent_messages(conversation_id,role,content) SELECT $1,'user','Hi' FROM generate_series(1,3)", [conversation]);
  const claims = await Promise.all(Array.from({ length: 10 }, () => db.query('SELECT claim_agent_sentiment_check($1,$2) AS ok', [conversation,randomUUID()])));
  assert.equal(claims.filter(c => c.rows[0].ok).length, 1);
  // No completion: a failed optional call should not be retried on every message.
  assert.equal((await db.query('SELECT claim_agent_sentiment_check($1,$2) AS ok', [conversation,randomUUID()])).rows[0].ok, false);
  for (const role of ['anon', 'authenticated']) {
    assert.equal((await db.query("SELECT has_table_privilege($1,'agent_sentiment_checks','SELECT') AS ok", [role])).rows[0].ok, false);
    for (const fn of ['get_ai_usage_summary()', 'claim_agent_sentiment_check(uuid,uuid)', 'finish_agent_sentiment_check(uuid,uuid,text)', 'complete_ai_provider_request(uuid,text,jsonb)']) {
      assert.equal((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS ok', [role,fn])).rows[0].ok, false);
    }
  }
});
