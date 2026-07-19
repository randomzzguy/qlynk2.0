import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

if (process.env.ALLOW_PRODUCTION_SMOKE_TEST !== '1') {
  console.error('Refusing to create temporary production fixtures. Set ALLOW_PRODUCTION_SMOKE_TEST=1 explicitly.');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomBytes(5).toString('hex');
const password = `Qlynk-Smoke-${randomBytes(18).toString('base64url')}!`;
const fixtures = [
  { label: 'A', email: `launch-smoke-a-${suffix}@example.invalid`, username: `smoke_a_${suffix}` },
  { label: 'B', email: `launch-smoke-b-${suffix}@example.invalid`, username: `smoke_b_${suffix}` },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function requireResult(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function createFixture(fixture) {
  const created = await requireResult(admin.auth.admin.createUser({
    email: fixture.email,
    password,
    email_confirm: true,
    user_metadata: { username: fixture.username, launch_smoke_fixture: true },
  }), `create auth user ${fixture.label}`);
  fixture.id = created.user.id;

  await requireResult(admin.from('profiles').upsert({ id: fixture.id, username: fixture.username, full_name: `Smoke ${fixture.label}` }), `profile ${fixture.label}`);
  await requireResult(admin.from('agent_configs').upsert({ user_id: fixture.id, agent_name: `Smoke Agent ${fixture.label}`, is_enabled: true }), `agent ${fixture.label}`);
  await requireResult(admin.rpc('save_agent_rule_config', {
    p_owner_id: fixture.id,
    p_agent_type: 'operations',
    p_rules: {
      purpose: `Private operations purpose ${fixture.label}`,
      audience: `Private audience ${fixture.label}`,
      allowed_topics: ['smoke testing'],
      blocked_topics: ['private data'],
      behavior_rules: ['Use verified information'],
      forbidden_behaviors: ['Do not guess'],
      uncertainty_message: 'Escalate this question.',
      escalation_message: 'Contact the owner.',
      custom_instructions: `private-rule-${fixture.label}-${suffix}`,
      response_length: 'balanced',
      scope_mode: 'strict',
      daily_message_limit: 50,
    },
  }), `private agent rules ${fixture.label}`);
  await requireResult(admin.from('subscriptions').upsert({
    user_id: fixture.id,
    tier: 'trial',
    status: 'trialing',
    trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }), `subscription ${fixture.label}`);
  await requireResult(admin.from('agent_knowledge').insert({ user_id: fixture.id, title: `Private ${fixture.label}`, content: `secret-${fixture.label}-${suffix}`, is_active: true }), `knowledge ${fixture.label}`);
  await requireResult(admin.from('agent_documents').insert({
    user_id: fixture.id,
    filename: 'smoke.txt',
    file_type: 'text/plain',
    file_size: 10,
    storage_path: `${fixture.id}/smoke.txt`,
    is_processed: false,
    processing_status: 'pending',
  }), `document ${fixture.label}`);
  const conversation = await requireResult(admin.from('agent_conversations').insert({
    agent_owner_id: fixture.id,
    visitor_id: randomUUID(),
    visitor_name: `Visitor ${fixture.label}`,
  }).select('id').single(), `conversation ${fixture.label}`);
  fixture.conversationId = conversation.id;
  const message = await requireResult(admin.from('agent_messages').insert({
    conversation_id: fixture.conversationId,
    role: 'user',
    content: `private-message-${fixture.label}-${suffix}`,
  }).select('id').single(), `message ${fixture.label}`);
  fixture.messageId = message.id;
  await requireResult(admin.rpc('record_agent_knowledge_gap', {
    p_owner_id: fixture.id,
    p_question: `Private unanswered question ${fixture.label}`,
    p_normalized_question: `private unanswered question ${fixture.label.toLowerCase()}`,
    p_conversation_id: fixture.conversationId,
  }), `knowledge gap ${fixture.label}`);
  await requireResult(admin.from('agent_message_feedback').insert({
    agent_owner_id: fixture.id,
    conversation_id: fixture.conversationId,
    message_id: fixture.messageId,
    visitor_key_hash: fixture.label.toLowerCase().repeat(64),
    rating: 1,
  }), `message feedback ${fixture.label}`);
  await requireResult(admin.from('agent_config_drafts').insert({
    user_id: fixture.id,
    config: { agent_name: `Private draft ${fixture.label}`, agent_type: 'operations' },
    rules: { purpose: `Private draft purpose ${fixture.label}` },
  }), `agent draft ${fixture.label}`);
  await requireResult(admin.from('agent_publish_versions').insert({
    user_id: fixture.id,
    version: 1,
    config: { agent_name: `Private publish ${fixture.label}`, agent_type: 'operations' },
    rules: { purpose: `Private publish purpose ${fixture.label}` },
  }), `agent publish snapshot ${fixture.label}`);
  await requireResult(admin.from('page_views').insert({
    page_owner_id: fixture.id,
    visitor_id: randomUUID(),
    referrer: 'https://example.com/smoke-test',
  }), `page view ${fixture.label}`);
}

async function authenticatedClient(fixture) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await requireResult(client.auth.signInWithPassword({ email: fixture.email, password }), `sign in ${fixture.label}`);
  assert(signedIn.user?.id === fixture.id, `Unexpected authenticated user for ${fixture.label}`);
  return client;
}

async function assertOwnerIsolation(client, owner, other) {
  const checks = [
    ['profiles', 'id', owner.id, other.id],
    ['agent_configs', 'user_id', owner.id, other.id],
    ['agent_knowledge', 'user_id', owner.id, other.id],
    ['agent_documents', 'user_id', owner.id, other.id],
    ['subscriptions', 'user_id', owner.id, other.id],
    ['agent_conversations', 'agent_owner_id', owner.id, other.id],
    ['page_views', 'page_owner_id', owner.id, other.id],
    ['agent_knowledge_gaps', 'user_id', owner.id, other.id],
    ['agent_message_feedback', 'agent_owner_id', owner.id, other.id],
  ];

  for (const [table, column, ownId, otherId] of checks) {
    const own = await requireResult(client.from(table).select('*').eq(column, ownId), `${owner.label} reads own ${table}`);
    assert(own.length >= 1, `${owner.label} cannot read own ${table}`);
    const foreign = await requireResult(client.from(table).select('*').eq(column, otherId), `${owner.label} reads foreign ${table}`);
    assert(foreign.length === 0, `${owner.label} can read ${other.label} ${table}`);
  }

  const ownMessages = await requireResult(
    client.from('agent_messages').select('*').eq('conversation_id', owner.conversationId),
    `${owner.label} reads own messages`
  );
  assert(ownMessages.length >= 1, `${owner.label} cannot read own messages`);
  const foreignMessages = await requireResult(
    client.from('agent_messages').select('*').eq('conversation_id', other.conversationId),
    `${owner.label} reads foreign messages`
  );
  assert(foreignMessages.length === 0, `${owner.label} can read ${other.label} messages`);

  const attemptedUpdate = await requireResult(
    client.from('agent_configs').update({ agent_name: 'unauthorized-change' }).eq('user_id', other.id).select('user_id'),
    `${owner.label} attempts foreign agent update`
  );
  assert(attemptedUpdate.length === 0, `${owner.label} can update ${other.label} agent`);

  const attemptedDelete = await requireResult(
    client.from('agent_knowledge').delete().eq('user_id', other.id).select('id'),
    `${owner.label} attempts foreign knowledge delete`
  );
  assert(attemptedDelete.length === 0, `${owner.label} can delete ${other.label} knowledge`);
}

async function assertStorageIsolation(clientA, clientB, fixtureA) {
  const path = `${fixtureA.id}/smoke.txt`;
  await requireResult(clientA.storage.from('agent-documents').upload(path, Buffer.from('0123456789'), {
    contentType: 'text/plain',
    upsert: false,
  }), 'A uploads own storage object');

  const ownDownload = await clientA.storage.from('agent-documents').download(path);
  assert(!ownDownload.error && ownDownload.data, 'A cannot download own storage object');
  const foreignDownload = await clientB.storage.from('agent-documents').download(path);
  assert(Boolean(foreignDownload.error) && !foreignDownload.data, 'B can download A storage object');
}

async function assertPrivateRuleIsolation(client, fixture) {
  for (const [table, ownerColumn] of [
    ['agent_rule_configs', 'user_id'],
    ['agent_rule_config_versions', 'user_id'],
    ['agent_security_events', 'agent_owner_id'],
    ['agent_config_drafts', 'user_id'],
    ['agent_publish_versions', 'user_id'],
  ]) {
    const { data, error } = await client.from(table).select('*').eq(ownerColumn, fixture.id);
    assert(Boolean(error) && !data, `${fixture.label} can access service-managed ${table} directly`);
  }
}

let clients = [];
try {
  for (const fixture of fixtures) await createFixture(fixture);
  clients = await Promise.all(fixtures.map(authenticatedClient));
  await assertOwnerIsolation(clients[0], fixtures[0], fixtures[1]);
  await assertOwnerIsolation(clients[1], fixtures[1], fixtures[0]);
  await assertPrivateRuleIsolation(clients[0], fixtures[0]);
  await assertPrivateRuleIsolation(clients[1], fixtures[1]);
  await assertStorageIsolation(clients[0], clients[1], fixtures[0]);
  console.log('Production two-account isolation passed for profiles/deletion state, agents, private rules/history, drafts/publish snapshots, knowledge/gaps, feedback, documents, subscriptions, conversations, messages, analytics, writes, and private Storage.');
} finally {
  for (const fixture of fixtures) {
    if (!fixture.id) continue;
    await admin.storage.from('agent-documents').remove([`${fixture.id}/smoke.txt`]);
    const { error } = await admin.auth.admin.deleteUser(fixture.id);
    if (error) console.error(`Cleanup warning for fixture ${fixture.label}: ${error.message}`);
  }
}
