import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { vector } from '@electric-sql/pglite-pgvector';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();

const db = await PGlite.create({ extensions: { pgcrypto, vector } });

const bootstrapSql = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;

  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE FUNCTION auth.uid()
  RETURNS UUID
  LANGUAGE sql
  STABLE
  AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

  CREATE SCHEMA storage;
  CREATE TABLE storage.buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public BOOLEAN NOT NULL DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[]
  );
  CREATE TABLE storage.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner UUID,
    metadata JSONB
  );
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE FUNCTION storage.foldername(object_name TEXT)
  RETURNS TEXT[]
  LANGUAGE sql
  IMMUTABLE
  AS $$
    SELECT regexp_split_to_array(object_name, '/')
  $$;
  CREATE FUNCTION storage.extension(object_name TEXT)
  RETURNS TEXT
  LANGUAGE sql
  IMMUTABLE
  AS $$
    SELECT nullif(regexp_replace(object_name, '^.*\.', ''), object_name)
  $$;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
`;

await db.exec(bootstrapSql);

const fixtureUserId = '11111111-1111-4111-8111-111111111111';

for (const file of migrationFiles) {
  if (file === '20260711030000_hash_agent_access_passwords.sql') {
    await db.exec(`
      INSERT INTO auth.users (id, email)
      VALUES ('${fixtureUserId}', 'migration-test@example.com');

      INSERT INTO public.profiles (id, username, account_deletion_requested_at)
      VALUES ('${fixtureUserId}', 'migration_test', now());

      INSERT INTO public.agent_configs (user_id, access_level, access_password)
      VALUES ('${fixtureUserId}', 'password', 'legacy-secret');

      INSERT INTO public.agent_knowledge (user_id, title, content, is_active)
      VALUES ('${fixtureUserId}', 'Private fixture', 'Sensitive fixture', true);

      INSERT INTO public.subscriptions (user_id, tier, status)
      VALUES ('${fixtureUserId}', 'trial', 'trialing');

      INSERT INTO public.page_views (page_owner_id, visitor_id)
      VALUES ('${fixtureUserId}', 'fixture-visitor');
    `);
  }

  if (file === '20260719040000_add_dashboard_walkthrough_state.sql') {
    await db.exec(`
      UPDATE public.profiles
      SET onboarding_completed = true
      WHERE id = '${fixtureUserId}';
    `);
  }

  const sql = await readFile(join(migrationsDirectory, file), 'utf8');
  try {
    await db.exec(sql);
  } catch (error) {
    throw new Error(`Migration failed: ${file}\n${error.message}`, { cause: error });
  }
}

async function scalar(sql, column = 'value') {
  const result = await db.query(sql);
  return result.rows[0]?.[column];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const credentialIsValid = await scalar(`
  SELECT (
    password_hash <> 'legacy-secret'
    AND extensions.crypt('legacy-secret', password_hash) = password_hash
  ) AS value
  FROM public.agent_access_credentials
  WHERE user_id = '${fixtureUserId}'
`);
assert(credentialIsValid === true, 'Legacy access password was not converted to bcrypt.');

const plaintextWasCleared = await scalar(`
  SELECT access_password IS NULL AS value
  FROM public.agent_configs
  WHERE user_id = '${fixtureUserId}'
`);
assert(plaintextWasCleared === true, 'Plaintext access password was not cleared.');

const deprecatedAgentPublishedStateIsDocumented = await scalar(`
  SELECT col_description('public.agent_configs'::regclass, attnum) LIKE 'Deprecated compatibility column.%' AS value
  FROM pg_attribute
  WHERE attrelid = 'public.agent_configs'::regclass
    AND attname = 'is_published'
    AND NOT attisdropped
`);
assert(deprecatedAgentPublishedStateIsDocumented === true, 'Legacy agent is_published state is not documented as deprecated.');

const agentPublicColumns = await db.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'agent_configs_public'
`);
assert(
  !agentPublicColumns.rows.some((row) => row.column_name === 'access_password'),
  'Public agent view exposes access_password.'
);
assert(
  agentPublicColumns.rows.some((row) => row.column_name === 'agent_type'),
  'Public agent view does not expose the safe agent type label.'
);
assert(
  !agentPublicColumns.rows.some((row) => ['custom_instructions', 'allowed_topics', 'blocked_topics'].includes(row.column_name)),
  'Public agent view exposes private owner rules.'
);

const profilePublicColumns = await db.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles_public'
`);
assert(
  !profilePublicColumns.rows.some((row) => row.column_name.startsWith('account_deletion_')),
  'Public profile view exposes account deletion fields.'
);
assert(
  !profilePublicColumns.rows.some((row) => row.column_name.startsWith('dashboard_tour_')),
  'Public profile view exposes private dashboard walkthrough state.'
);

for (const view of ['profiles_public', 'agent_configs_public']) {
  assert(
    await scalar(`
      SELECT coalesce('security_invoker=true' = ANY(reloptions), false) AS value
      FROM pg_class
      WHERE oid = 'public.${view}'::regclass
    `) === true,
    `${view} is not a security-invoker view.`
  );
}
assert(
  await scalar(`SELECT definition LIKE '%profiles_public_data%' AS value FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles_public'`) === true,
  'profiles_public is not backed by the safe projection table.'
);
assert(
  await scalar(`SELECT definition LIKE '%agent_configs_public_data%' AS value FROM pg_views WHERE schemaname = 'public' AND viewname = 'agent_configs_public'`) === true,
  'agent_configs_public is not backed by the safe projection table.'
);

await db.exec(`UPDATE public.profiles SET full_name = 'Projection Sync Test' WHERE id = '${fixtureUserId}'`);
await db.exec(`UPDATE public.agent_configs SET agent_name = 'Projection Sync Agent' WHERE user_id = '${fixtureUserId}'`);
assert(
  await scalar(`SELECT full_name = 'Projection Sync Test' AS value FROM public.profiles_public WHERE id = '${fixtureUserId}'`) === true,
  'Profile public projection did not synchronize.'
);
assert(
  await scalar(`SELECT agent_name = 'Projection Sync Agent' AS value FROM public.agent_configs_public WHERE user_id = '${fixtureUserId}'`) === true,
  'Agent public projection did not synchronize.'
);

await db.exec(`UPDATE public.profiles SET username = 'renamed_fixture' WHERE id = '${fixtureUserId}'`);
assert(
  await scalar(`SELECT username_changed_at IS NOT NULL AS value FROM public.profiles WHERE id = '${fixtureUserId}'`) === true,
  'A successful username change did not start the cooldown.'
);
assert(
  await scalar(`SELECT username = 'renamed_fixture' AS value FROM public.profiles_public WHERE id = '${fixtureUserId}'`) === true,
  'A username change did not synchronize to the public profile projection.'
);
let repeatedUsernameChangeRejected = false;
try {
  await db.exec(`UPDATE public.profiles SET username = 'renamed_again' WHERE id = '${fixtureUserId}'`);
} catch (error) {
  repeatedUsernameChangeRejected = String(error.message).includes('once every 30 days');
}
assert(repeatedUsernameChangeRejected, 'The database allowed a second username change inside 30 days.');
const usernameChangedAt = await scalar(`SELECT username_changed_at AS value FROM public.profiles WHERE id = '${fixtureUserId}'`);
await db.exec(`UPDATE public.profiles SET username_changed_at = NULL WHERE id = '${fixtureUserId}'`);
assert(
  String(await scalar(`SELECT username_changed_at AS value FROM public.profiles WHERE id = '${fixtureUserId}'`)) === String(usernameChangedAt),
  'An owner can tamper with the username cooldown timestamp.'
);

const profileEmailWasBackfilled = await scalar(`
  SELECT email = 'migration-test@example.com' AS value
  FROM public.profiles
  WHERE id = '${fixtureUserId}'
`);
assert(profileEmailWasBackfilled === true, 'Private profile email was not backfilled from Auth.');

const profileEmailIndexIsUnique = await scalar(`
  SELECT indisunique AS value
  FROM pg_index
  WHERE indexrelid = 'public.profiles_email_unique_ci_idx'::regclass
`);
assert(profileEmailIndexIsUnique === true, 'Private profile email index is missing or not unique.');

const existingProfileTourState = await db.query(`
  SELECT dashboard_tour_status, dashboard_tour_version, dashboard_tour_completed_at
  FROM public.profiles
  WHERE id = '${fixtureUserId}'
`);
assert(
  existingProfileTourState.rows[0]?.dashboard_tour_status === 'skipped'
    && existingProfileTourState.rows[0]?.dashboard_tour_version === 1
    && existingProfileTourState.rows[0]?.dashboard_tour_completed_at instanceof Date,
  'Existing onboarded accounts were not safely excluded from the automatic dashboard tour.'
);
assert(
  await scalar(`
    SELECT column_default = '''pending''::text' AS value
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'dashboard_tour_status'
  `) === true,
  'New profiles do not default to a pending dashboard tour.'
);
assert(
  await scalar(`
    SELECT pg_get_constraintdef(oid) LIKE '%pending%completed%skipped%' AS value
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_dashboard_tour_status_check'
  `) === true,
  'Dashboard tour status is not constrained to the supported states.'
);

const privateProfilePolicyCount = await scalar(`
  SELECT count(*)::int AS value
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles'
`);
assert(privateProfilePolicyCount === 1, 'Private profiles table does not have exactly one owner policy.');

const privateProfilePolicyIsOwnerOnly = await scalar(`
  SELECT (
    cmd = 'ALL'
    AND 'authenticated' = ANY(roles)
    AND qual LIKE '%auth.uid() = id%'
    AND with_check LIKE '%auth.uid() = id%'
  ) AS value
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles'
`);
assert(privateProfilePolicyIsOwnerOnly === true, 'Private profile policy is not owner-only.');

for (const [table, expectedPolicyCount] of Object.entries({
  agent_configs: 1,
  agent_knowledge: 1,
  agent_documents: 1,
  agent_knowledge_chunks: 1,
  agent_knowledge_entities: 1,
  agent_knowledge_entity_aliases: 1,
  agent_knowledge_claims: 1,
  agent_knowledge_claim_evidence: 1,
  agent_knowledge_relationships: 1,
  agent_knowledge_contradictions: 1,
  agent_memory_observations: 1,
  agent_memory_patterns: 1,
  agent_memory_pattern_support: 1,
  agent_memory_preferences: 1,
  agent_conversations: 1,
  agent_messages: 1,
  page_views: 1,
  subscriptions: 2,
  profiles_public_data: 1,
  agent_configs_public_data: 1,
})) {
  const policyCount = await scalar(`
    SELECT count(*)::int AS value
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = '${table}'
  `);
  assert(policyCount === expectedPolicyCount, `${table} has unexpected or drifted RLS policies.`);
}

const bucketIsPrivate = await scalar(`
  SELECT public = false AS value
  FROM storage.buckets
  WHERE id = 'agent-documents'
`);
assert(bucketIsPrivate === true, 'agent-documents bucket is not private.');

const bucketLimitsAreSafe = await scalar(`
  SELECT (
    file_size_limit = 3145728
    AND allowed_mime_types <@ ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]::text[]
  ) AS value
  FROM storage.buckets
  WHERE id = 'agent-documents'
`);
assert(bucketLimitsAreSafe === true, 'agent-documents bucket size or MIME limits are unsafe.');

const rlsTables = [
  'agent_configs',
  'agent_knowledge',
  'agent_knowledge_chunks',
  'agent_knowledge_entities',
  'agent_knowledge_entity_aliases',
  'agent_knowledge_claims',
  'agent_knowledge_claim_evidence',
  'agent_knowledge_relationships',
  'agent_knowledge_contradictions',
  'agent_memory_observations',
  'agent_memory_patterns',
  'agent_memory_pattern_support',
  'agent_memory_preferences',
  'agent_documents',
  'agent_conversations',
  'agent_messages',
  'agent_access_credentials',
  'profiles',
  'subscriptions',
  'stripe_webhook_events',
  'api_rate_limits',
  'agent_rule_configs',
  'agent_rule_config_versions',
  'agent_security_events',
  'agent_knowledge_gaps',
  'agent_message_feedback',
  'agent_config_drafts',
  'agent_publish_versions',
  'profiles_public_data',
  'agent_configs_public_data',
  'widget_installations',
];
const enabledRlsCount = await scalar(`
  SELECT count(*)::int AS value
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY(ARRAY[${rlsTables.map((name) => `'${name}'`).join(',')}])
    AND c.relrowsecurity
`);
assert(enabledRlsCount === rlsTables.length, 'RLS is not enabled on every sensitive table.');

await db.exec('SET ROLE anon;');
for (const table of ['agent_configs', 'agent_knowledge', 'agent_knowledge_chunks', 'agent_knowledge_entities', 'agent_knowledge_entity_aliases', 'agent_knowledge_claims', 'agent_knowledge_claim_evidence', 'agent_knowledge_relationships', 'agent_knowledge_contradictions', 'agent_memory_observations', 'agent_memory_patterns', 'agent_memory_pattern_support', 'agent_memory_preferences', 'agent_documents', 'profiles', 'subscriptions', 'stripe_webhook_events', 'api_rate_limits', 'agent_rule_configs', 'agent_rule_config_versions', 'agent_security_events', 'agent_knowledge_gaps', 'agent_message_feedback', 'agent_config_drafts', 'agent_publish_versions', 'widget_installations']) {
  let count = 0;
  try {
    count = await scalar(`SELECT count(*)::int AS value FROM public.${table}`);
  } catch (error) {
    if (error.code !== '42501') throw error;
  }
  assert(count === 0, `Anonymous role can read ${table}.`);
}
assert(
  await scalar('SELECT count(*)::int AS value FROM public.agent_configs_public') === 1,
  'Anonymous role cannot read the safe agent view.'
);
assert(
  await scalar('SELECT count(*)::int AS value FROM public.profiles_public') === 1,
  'Anonymous role cannot read the safe profile view.'
);
assert(
  await scalar('SELECT count(*)::int AS value FROM public.agent_configs_public_data') === 1,
  'Anonymous role cannot read the safe agent projection.'
);
assert(
  await scalar('SELECT count(*)::int AS value FROM public.profiles_public_data') === 1,
  'Anonymous role cannot read the safe profile projection.'
);

for (const statement of [
  `INSERT INTO public.agent_conversations (agent_owner_id, visitor_id)
   VALUES ('${fixtureUserId}', 'anonymous-write')`,
  `INSERT INTO public.agent_messages (conversation_id, role, content)
   VALUES ('22222222-2222-4222-8222-222222222222', 'user', 'anonymous-write')`,
  `INSERT INTO public.page_views (page_owner_id, visitor_id)
   VALUES ('${fixtureUserId}', 'anonymous-write')`,
  `UPDATE public.profiles_public_data SET full_name = 'anonymous-write' WHERE id = '${fixtureUserId}'`,
  `UPDATE public.agent_configs_public_data SET agent_name = 'anonymous-write' WHERE user_id = '${fixtureUserId}'`,
]) {
  let rejected = false;
  try {
    await db.exec(statement);
  } catch {
    rejected = true;
  }
  assert(rejected, 'An anonymous tracking write was accepted.');
}

await db.exec('RESET ROLE;');
assert(
  await scalar(`SELECT has_function_privilege('anon', 'public.check_api_rate_limit(text,text,integer,integer)', 'EXECUTE') AS value`) === false,
  'Anonymous role can execute the shared rate limiter.'
);
assert(
  await scalar(`SELECT has_function_privilege('authenticated', 'public.save_agent_rule_config(uuid,text,jsonb)', 'EXECUTE') AS value`) === false,
  'Authenticated clients can bypass the validated agent-rules API.'
);
assert(
  await scalar(`SELECT has_function_privilege('authenticated', 'public.consume_agent_message_credit(uuid,integer)', 'EXECUTE') AS value`) === false,
  'Authenticated clients can reserve or manipulate message credits.'
);
assert(
  await scalar(`SELECT has_function_privilege('authenticated', 'public.record_agent_knowledge_gap(uuid,text,text,uuid)', 'EXECUTE') AS value`) === false,
  'Authenticated clients can forge knowledge-gap activity.'
);
assert(
  await scalar(`SELECT has_function_privilege('authenticated', 'public.search_agent_knowledge_chunks(uuid,text,integer)', 'EXECUTE') AS value`) === false,
  'Authenticated clients can bypass the tenant-scoped knowledge retrieval API.'
);
for (const signature of [
  'public.claim_agent_knowledge_embedding_jobs(integer,uuid)',
  'public.store_agent_knowledge_chunk_embeddings(text,jsonb)',
  'public.fail_agent_knowledge_embedding_jobs(uuid[],text)',
  'public.hybrid_search_agent_knowledge_chunks(uuid,text,extensions.vector,integer,text,real)',
  'public.claim_agent_knowledge_graph_jobs(integer,uuid)',
  'public.store_agent_knowledge_graph_extraction(uuid,text,jsonb)',
  'public.fail_agent_knowledge_graph_jobs(uuid[],text)',
  'public.review_agent_knowledge_claim(uuid,uuid,text,text)',
  'public.search_agent_knowledge_graph(uuid,text,integer)',
  'public.record_agent_memory_observation(uuid,uuid,text,text,text,timestamp with time zone,timestamp with time zone)',
  'public.record_agent_memory_preference(uuid,uuid,text,text,timestamp with time zone)',
  'public.claim_agent_intent_embedding_jobs(integer,uuid)',
  'public.store_agent_intent_embeddings(text,jsonb)',
  'public.fail_agent_intent_embedding_jobs(uuid[],text)',
  'public.refresh_agent_memory_patterns(uuid,real)',
  'public.review_agent_memory_item(uuid,text,uuid,text,text)',
  'public.search_agent_temporal_memory(uuid,text,integer)',
]) {
  assert(
    await scalar(`SELECT has_function_privilege('authenticated', '${signature}', 'EXECUTE') AS value`) === false,
    `Authenticated clients can execute private semantic retrieval function ${signature}.`
  );
}
assert(
  await scalar(`SELECT count(*)::int > 0 AS value FROM public.agent_knowledge_chunks WHERE user_id = '${fixtureUserId}'`) === true,
  'Existing knowledge was not backfilled into retrieval chunks.'
);
for (const role of ['anon', 'authenticated']) {
  assert(
    await scalar(`SELECT has_function_privilege('${role}', 'public.sync_profile_public_projection()', 'EXECUTE') AS value`) === false,
    `${role} clients can invoke the profile public-projection trigger directly.`
  );
  assert(
    await scalar(`SELECT has_function_privilege('${role}', 'public.sync_agent_config_public_projection()', 'EXECUTE') AS value`) === false,
    `${role} clients can invoke the agent-config public-projection trigger directly.`
  );
}
await db.exec('SET ROLE service_role;');
const longKnowledgeId = await scalar(`
  INSERT INTO public.agent_knowledge (user_id, title, content, source_type, priority, is_active)
  VALUES (
    '${fixtureUserId}',
    'Long handbook',
    repeat('General handbook context. ', 180) || 'Cancellation requests require 48 hours notice.',
    'text',
    5,
    true
  )
  RETURNING id AS value
`);
assert(
  await scalar(`SELECT count(*)::int > 1 AS value FROM public.agent_knowledge_chunks WHERE knowledge_id = '${longKnowledgeId}'`) === true,
  'Long knowledge was not split into multiple retrieval chunks.'
);
const indexedKnowledge = await db.query(`
  SELECT * FROM public.search_agent_knowledge_chunks(
    '${fixtureUserId}',
    'cancellation requests 48 hours notice',
    10
  )
`);
assert(
  indexedKnowledge.rows.some((row) => row.knowledge_id === longKnowledgeId && row.content.includes('48 hours notice')),
  'Chunk retrieval did not find relevant content near the end of a long source.'
);
const claimedEmbeddingJobs = await db.query(`
  SELECT * FROM public.claim_agent_knowledge_embedding_jobs(32, '${fixtureUserId}')
`);
const targetEmbeddingJob = claimedEmbeddingJobs.rows.find((row) =>
  row.content.includes('Cancellation requests require 48 hours notice')
);
assert(Boolean(targetEmbeddingJob), 'The semantic embedding queue did not claim the long-source chunk.');

const unitVector = (axis) => Array.from({ length: 384 }, (_, index) => index === axis ? 1 : 0);
const embeddingPayload = claimedEmbeddingJobs.rows.map((row) => ({
  id: row.chunk_id,
  content_hash: row.content_hash,
  embedding: unitVector(row.chunk_id === targetEmbeddingJob.chunk_id ? 0 : 1),
}));
const escapedEmbeddingPayload = JSON.stringify(embeddingPayload).replaceAll("'", "''");
const storedEmbeddingCount = await scalar(`
  SELECT public.store_agent_knowledge_chunk_embeddings(
    'gte-small@1',
    '${escapedEmbeddingPayload}'::jsonb
  ) AS value
`);
assert(
  storedEmbeddingCount === claimedEmbeddingJobs.rows.length,
  'Claimed semantic embeddings were not stored atomically.'
);

const queryVector = `[${unitVector(0).join(',')}]`;
const hybridKnowledge = await db.query(`
  SELECT * FROM public.hybrid_search_agent_knowledge_chunks(
    '${fixtureUserId}',
    'unrelated semantic wording',
    '${queryVector}'::extensions.vector(384),
    10,
    'gte-small@1',
    0.45
  )
`);
assert(
  hybridKnowledge.rows[0]?.chunk_id === targetEmbeddingJob.chunk_id,
  'Hybrid retrieval did not rank the closest semantic chunk first.'
);
await db.exec(`UPDATE public.agent_knowledge SET priority = 4 WHERE id = '${longKnowledgeId}'`);
assert(
  await scalar(`
    SELECT embedding_status = 'complete' AND id = '${targetEmbeddingJob.chunk_id}' AS value
    FROM public.agent_knowledge_chunks
    WHERE knowledge_id = '${longKnowledgeId}'
      AND content LIKE '%Cancellation requests require 48 hours notice%'
  `) === true,
  'A metadata-only knowledge edit unnecessarily discarded a valid embedding.'
);
await db.exec(`
  UPDATE public.agent_knowledge
  SET content = content || ' Updated source wording.'
  WHERE id = '${longKnowledgeId}'
`);
assert(
  await scalar(`
    SELECT bool_and(embedding_status = 'pending' AND embedding IS NULL) AS value
    FROM public.agent_knowledge_chunks
    WHERE knowledge_id = '${longKnowledgeId}'
  `) === true,
  'A source-content change did not invalidate and requeue its embeddings.'
);

const graphSourceOneId = await scalar(`
  INSERT INTO public.agent_knowledge (user_id, title, content, source_type, priority, is_active)
  VALUES (
    '${fixtureUserId}',
    'Studio offering',
    'Qlynk Studio offers Strategy Sprint. Strategy Sprint costs $500.',
    'text',
    5,
    true
  )
  RETURNING id AS value
`);
const graphSourceTwoId = await scalar(`
  INSERT INTO public.agent_knowledge (user_id, title, content, source_type, priority, is_active)
  VALUES (
    '${fixtureUserId}',
    'Studio delivery',
    'Strategy Sprint is delivered remotely. Strategy Sprint costs $700.',
    'text',
    5,
    true
  )
  RETURNING id AS value
`);
const graphJobs = await db.query(`
  SELECT * FROM public.claim_agent_knowledge_graph_jobs(12, '${fixtureUserId}')
`);
const graphJobOne = graphJobs.rows.find((row) => row.source_title === 'Studio offering');
const graphJobTwo = graphJobs.rows.find((row) => row.source_title === 'Studio delivery');
assert(Boolean(graphJobOne && graphJobTwo), 'The knowledge graph queue did not claim verified source chunks.');

function escapedJson(value) {
  return JSON.stringify(value).replaceAll("'", "''");
}

const graphPayloadOne = {
  entities: [
    { id: 'studio', name: 'Qlynk Studio', type: 'organization', aliases: [], confidence: 0.98 },
    { id: 'sprint', name: 'Strategy Sprint', type: 'service', aliases: [], confidence: 0.98 },
  ],
  claims: [
    {
      subject_id: 'studio',
      predicate: 'offers',
      object_entity_id: 'sprint',
      object_value: '',
      statement: 'Qlynk Studio offers Strategy Sprint.',
      excerpt: 'Qlynk Studio offers Strategy Sprint.',
      confidence: 0.98,
    },
    {
      subject_id: 'sprint',
      predicate: 'costs',
      object_entity_id: '',
      object_value: '$500',
      statement: 'Strategy Sprint costs $500.',
      excerpt: 'Strategy Sprint costs $500.',
      confidence: 0.98,
    },
  ],
};
const graphPayloadTwo = {
  entities: [
    { id: 'sprint', name: 'Strategy Sprint', type: 'service', aliases: [], confidence: 0.98 },
  ],
  claims: [
    {
      subject_id: 'sprint',
      predicate: 'delivery_mode',
      object_entity_id: '',
      object_value: 'remotely',
      statement: 'Strategy Sprint is delivered remotely.',
      excerpt: 'Strategy Sprint is delivered remotely.',
      confidence: 0.98,
    },
    {
      subject_id: 'sprint',
      predicate: 'costs',
      object_entity_id: '',
      object_value: '$700',
      statement: 'Strategy Sprint costs $700.',
      excerpt: 'Strategy Sprint costs $700.',
      confidence: 0.98,
    },
  ],
};
await db.query(`
  SELECT public.store_agent_knowledge_graph_extraction(
    '${graphJobOne.chunk_id}',
    '${graphJobOne.content_hash}',
    '${escapedJson(graphPayloadOne)}'::jsonb
  )
`);
await db.query(`
  SELECT public.store_agent_knowledge_graph_extraction(
    '${graphJobTwo.chunk_id}',
    '${graphJobTwo.content_hash}',
    '${escapedJson(graphPayloadTwo)}'::jsonb
  )
`);
assert(
  await scalar(`SELECT count(*)::int = 4 AS value FROM public.agent_knowledge_claims WHERE user_id = '${fixtureUserId}'`) === true,
  'Graph extraction did not store atomic draft claims.'
);
assert(
  await scalar(`SELECT count(*)::int = 1 AS value FROM public.agent_knowledge_contradictions WHERE user_id = '${fixtureUserId}' AND status = 'open'`) === true,
  'Conflicting graph claims were not surfaced for review.'
);
assert(
  (await db.query(`SELECT * FROM public.search_agent_knowledge_graph('${fixtureUserId}', 'Strategy Sprint', 12)`)).rows.length === 0,
  'Unapproved graph claims entered chat retrieval.'
);

const offersClaimId = await scalar(`
  SELECT id AS value FROM public.agent_knowledge_claims
  WHERE user_id = '${fixtureUserId}' AND statement = 'Qlynk Studio offers Strategy Sprint.'
`);
await db.query(`
  SELECT public.review_agent_knowledge_claim('${fixtureUserId}', '${offersClaimId}', 'approve', NULL)
`);
const approvedConnection = await db.query(`
  SELECT * FROM public.search_agent_knowledge_graph('${fixtureUserId}', 'What does Qlynk Studio offer?', 12)
`);
assert(
  approvedConnection.rows.some((row) => row.claim_id === offersClaimId && row.graph_depth <= 1),
  'Approved entity relationship was not traversed by graph retrieval.'
);

const lowerCostClaimId = await scalar(`
  SELECT id AS value FROM public.agent_knowledge_claims
  WHERE user_id = '${fixtureUserId}' AND statement = 'Strategy Sprint costs $500.'
`);
let contradictionApprovalRejected = false;
try {
  await db.query(`SELECT public.review_agent_knowledge_claim('${fixtureUserId}', '${lowerCostClaimId}', 'approve', NULL)`);
} catch (error) {
  contradictionApprovalRejected = String(error.message).includes('resolution note');
}
assert(contradictionApprovalRejected, 'A contradictory claim was approved without an explicit owner resolution.');
await db.query(`
  SELECT public.review_agent_knowledge_claim(
    '${fixtureUserId}',
    '${lowerCostClaimId}',
    'approve',
    'Owner confirmed the current approved price from the Studio offering source.'
  )
`);
const resolvedCost = await db.query(`
  SELECT * FROM public.search_agent_knowledge_graph('${fixtureUserId}', 'Strategy Sprint cost', 12)
`);
assert(
  resolvedCost.rows.some((row) => row.statement === 'Strategy Sprint costs $500.')
    && !resolvedCost.rows.some((row) => row.statement === 'Strategy Sprint costs $700.'),
  'Contradiction resolution did not retain only the owner-approved claim.'
);
assert(
  await scalar(`SELECT count(*)::int = 1 AS value FROM public.agent_knowledge_claims WHERE user_id = '${fixtureUserId}' AND evidence_status = 'superseded'`) === true,
  'The conflicting graph claim was not superseded after owner resolution.'
);

await db.exec(`DELETE FROM public.agent_knowledge WHERE id = '${graphSourceOneId}'`);
assert(
  await scalar(`SELECT evidence_status = 'unresolved' AS value FROM public.agent_knowledge_claims WHERE id = '${offersClaimId}'`) === true,
  'A verified graph claim stayed active after its final supporting source was removed.'
);
await db.exec(`DELETE FROM public.agent_knowledge WHERE id = '${graphSourceTwoId}'`);

const studioEntityId = await scalar(`
  SELECT id AS value FROM public.agent_knowledge_entities
  WHERE user_id = '${fixtureUserId}' AND normalized_name = 'qlynk studio'
`);
assert(Boolean(studioEntityId), 'Verified graph entity was unavailable for temporal memory tests.');

const recurringObservationIds = [];
for (const occurredAt of ['2026-07-01T09:00:00Z', '2026-07-08T09:00:00Z', '2026-07-15T09:00:00Z']) {
  recurringObservationIds.push(await scalar(`
    SELECT public.record_agent_memory_observation(
      '${fixtureUserId}',
      '${studioEntityId}',
      'behavior',
      'delivery_day',
      'Qlynk Studio commonly schedules delivery on Tuesdays.',
      '${occurredAt}'::timestamptz,
      '2027-01-01T00:00:00Z'::timestamptz
    ) AS value
  `));
}
await db.query(`SELECT public.refresh_agent_memory_patterns('${fixtureUserId}', 0.82)`);
const recurrencePatternId = await scalar(`
  SELECT id AS value FROM public.agent_memory_patterns
  WHERE user_id = '${fixtureUserId}' AND pattern_type = 'recurrence' AND support_count = 3
`);
assert(Boolean(recurrencePatternId), 'Three dated observations did not produce a supported recurrence draft.');
assert(
  (await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'Tuesday delivery', 10)`)).rows.length === 0,
  'An unapproved temporal pattern entered chat retrieval.'
);
await db.query(`
  SELECT public.review_agent_memory_item(
    '${fixtureUserId}', 'pattern', '${recurrencePatternId}', 'approve', 'Owner confirmed this recurring schedule.'
  )
`);
assert(
  (await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'Qlynk Studio Tuesday delivery', 10)`))
    .rows.some((row) => row.memory_id === recurrencePatternId && row.support_count === 3),
  'An approved recurrence pattern was not available to temporal retrieval.'
);

await db.query(`
  SELECT public.review_agent_memory_item(
    '${fixtureUserId}', 'observation', '${recurringObservationIds[0]}', 'reject', 'This occurrence was entered in error.'
  )
`);
await db.query(`SELECT public.refresh_agent_memory_patterns('${fixtureUserId}', 0.82)`);
assert(
  await scalar(`SELECT evidence_status = 'unresolved' AND support_count = 2 AS value FROM public.agent_memory_patterns WHERE id = '${recurrencePatternId}'`) === true,
  'A recurrence pattern stayed verified after falling below its support threshold.'
);

const explicitPreferenceId = await scalar(`
  SELECT public.record_agent_memory_preference(
    '${fixtureUserId}',
    '${studioEntityId}',
    'delivery_format',
    'Remote workshops',
    '2027-01-01T00:00:00Z'::timestamptz
  ) AS value
`);
assert(
  (await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'Qlynk Studio remote workshops', 10)`))
    .rows.some((row) => row.memory_id === explicitPreferenceId && row.memory_kind === 'preference'),
  'An explicit active preference was not available to temporal retrieval.'
);
await db.query(`
  SELECT public.review_agent_memory_item(
    '${fixtureUserId}', 'preference', '${explicitPreferenceId}', 'revoke', 'Owner withdrew this preference.'
  )
`);
assert(
  !(await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'Qlynk Studio remote workshops', 10)`))
    .rows.some((row) => row.memory_id === explicitPreferenceId),
  'A withdrawn preference remained available to chat retrieval.'
);

for (const [value, occurredAt] of [
  ['Qlynk Studio package price was $500.', '2026-05-01T00:00:00Z'],
  ['Qlynk Studio package price is $700.', '2026-06-01T00:00:00Z'],
]) {
  await db.query(`
    SELECT public.record_agent_memory_observation(
      '${fixtureUserId}', '${studioEntityId}', 'state', 'package_price',
      '${value.replaceAll("'", "''")}', '${occurredAt}'::timestamptz, '2027-01-01T00:00:00Z'::timestamptz
    )
  `);
}
await db.query(`SELECT public.refresh_agent_memory_patterns('${fixtureUserId}', 0.82)`);
const changePatternId = await scalar(`
  SELECT id AS value FROM public.agent_memory_patterns
  WHERE user_id = '${fixtureUserId}' AND pattern_type = 'change' AND pattern_key LIKE 'change:%'
`);
assert(Boolean(changePatternId), 'Different dated values did not produce a change pattern.');
await db.query(`
  SELECT public.review_agent_memory_item(
    '${fixtureUserId}', 'pattern', '${changePatternId}', 'approve', 'Owner confirmed the recorded price change.'
  )
`);
assert(
  (await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'Qlynk Studio package price change', 10)`))
    .rows.some((row) => row.memory_id === changePatternId && row.memory_kind === 'pattern'),
  'An approved change-over-time pattern was not retrievable.'
);

const intentGapIds = [];
for (const [question, normalized] of [
  ['When are weekend appointments available?', 'when are weekend appointments available'],
  ['Can I book an appointment on Saturday?', 'can i book an appointment on saturday'],
]) {
  intentGapIds.push(await scalar(`
    SELECT public.record_agent_knowledge_gap(
      '${fixtureUserId}', '${question}', '${normalized}', NULL
    ) AS value
  `));
}
const claimedIntentJobs = await db.query(`
  SELECT * FROM public.claim_agent_intent_embedding_jobs(16, '${fixtureUserId}')
`);
const intentEmbeddingPayload = claimedIntentJobs.rows.map((row) => ({
  id: row.gap_id,
  embedding: unitVector(2),
}));
await db.query(`
  SELECT public.store_agent_intent_embeddings(
    'gte-small@1', '${escapedJson(intentEmbeddingPayload)}'::jsonb
  )
`);
await db.query(`SELECT public.refresh_agent_memory_patterns('${fixtureUserId}', 0.82)`);
const intentPatternId = await scalar(`
  SELECT id AS value FROM public.agent_memory_patterns
  WHERE user_id = '${fixtureUserId}' AND pattern_type = 'intent_cluster' AND support_count = 2
`);
assert(Boolean(intentPatternId), 'Semantically similar knowledge gaps were not grouped into an aggregate intent cluster.');
assert(
  await scalar(`SELECT consent_basis = 'aggregate_anonymous' AND entity_id IS NULL AS value FROM public.agent_memory_patterns WHERE id = '${intentPatternId}'`) === true,
  'Intent clustering created a personal entity or non-aggregate consent basis.'
);
await db.query(`
  SELECT public.review_agent_memory_item(
    '${fixtureUserId}', 'pattern', '${intentPatternId}', 'approve', 'Owner reviewed this aggregate content demand.'
  )
`);
assert(
  !(await db.query(`SELECT * FROM public.search_agent_temporal_memory('${fixtureUserId}', 'weekend appointment', 20)`))
    .rows.some((row) => row.memory_id === intentPatternId),
  'An aggregate visitor-intent cluster entered agent chat retrieval.'
);
await db.exec(`UPDATE public.agent_knowledge_gaps SET status = 'resolved', resolved_at = now() WHERE id = '${intentGapIds[0]}'`);
await db.query(`SELECT public.refresh_agent_memory_patterns('${fixtureUserId}', 0.82)`);
assert(
  await scalar(`SELECT evidence_status = 'unresolved' AND support_count = 1 AS value FROM public.agent_memory_patterns WHERE id = '${intentPatternId}'`) === true,
  'An intent cluster stayed verified after open support fell below two.'
);
const limiterKey = 'a'.repeat(64);
const firstLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
const secondLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
const thirdLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
assert(firstLimit.rows[0]?.allowed === true && firstLimit.rows[0]?.remaining === 1, 'First shared rate-limit request is incorrect.');
assert(secondLimit.rows[0]?.allowed === true && secondLimit.rows[0]?.remaining === 0, 'Second shared rate-limit request is incorrect.');
assert(thirdLimit.rows[0]?.allowed === false && thirdLimit.rows[0]?.remaining === 0, 'Shared rate limiter did not block excess traffic.');
const savedPromptVersion = await scalar(`
  SELECT public.save_agent_rule_config(
    '${fixtureUserId}',
    'property',
    '{
      "purpose":"Guide approved workers around the property.",
      "audience":"Workers",
      "allowed_topics":["chores","equipment"],
      "blocked_topics":["access codes"],
      "behavior_rules":["Use numbered steps"],
      "forbidden_behaviors":["Do not guess"],
      "uncertainty_message":"Ask the property manager.",
      "escalation_message":"Contact the property manager.",
      "custom_instructions":"Use room names exactly.",
      "response_length":"balanced",
      "scope_mode":"strict",
      "daily_message_limit":50
    }'::jsonb
  ) AS value
`);
assert(savedPromptVersion === 1, 'Initial agent rule version was not created atomically.');
assert(
  await scalar(`SELECT agent_type = 'property' AS value FROM public.agent_configs WHERE user_id = '${fixtureUserId}'`) === true,
  'Agent type was not updated with the private rules.'
);
assert(
  await scalar(`SELECT count(*)::int AS value FROM public.agent_rule_config_versions WHERE user_id = '${fixtureUserId}'`) === 1,
  'Agent rule version snapshot was not recorded.'
);
await db.exec(`UPDATE public.subscriptions SET messages_used = 0 WHERE user_id = '${fixtureUserId}'`);
const firstCredit = await db.query(`SELECT * FROM public.consume_agent_message_credit('${fixtureUserId}', 2)`);
const secondCredit = await db.query(`SELECT * FROM public.consume_agent_message_credit('${fixtureUserId}', 2)`);
const thirdCredit = await db.query(`SELECT * FROM public.consume_agent_message_credit('${fixtureUserId}', 2)`);
assert(firstCredit.rows[0]?.allowed === true && firstCredit.rows[0]?.messages_used === 1, 'First message credit reservation failed.');
assert(secondCredit.rows[0]?.allowed === true && secondCredit.rows[0]?.messages_used === 2, 'Second message credit reservation failed.');
assert(thirdCredit.rows[0]?.allowed === false && thirdCredit.rows[0]?.messages_used === 2, 'Atomic message quota allowed an excess request.');
const knowledgeGapId = await scalar(`
  SELECT public.record_agent_knowledge_gap(
    '${fixtureUserId}',
    'What time does breakfast start?',
    'what time does breakfast start',
    NULL
  ) AS value
`);
assert(Boolean(knowledgeGapId), 'Knowledge gap was not recorded.');
await db.query(`
  SELECT public.record_agent_knowledge_gap(
    '${fixtureUserId}',
    'What time does breakfast start?',
    'what time does breakfast start',
    NULL
  )
`);
assert(
  await scalar(`SELECT occurrence_count = 2 AS value FROM public.agent_knowledge_gaps WHERE id = '${knowledgeGapId}'`) === true,
  'Repeated knowledge gaps were not deduplicated and counted.'
);
await db.exec('RESET ROLE;');
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.subscriptions', 'SELECT') AS value`) === true,
  'Authenticated role was not granted subscription SELECT.'
);
assert(
  await scalar(`SELECT has_column_privilege('authenticated', 'public.subscriptions', 'post_trial_choice', 'UPDATE') AS value`) === true,
  'Authenticated role cannot update post_trial_choice.'
);
assert(
  await scalar(`SELECT has_column_privilege('authenticated', 'public.subscriptions', 'tier', 'UPDATE') AS value`) === false,
  'Authenticated role can update subscription tier.'
);
assert(
  await scalar(`SELECT has_column_privilege('authenticated', 'public.subscriptions', 'messages_used', 'UPDATE') AS value`) === false,
  'Authenticated role can update subscription usage.'
);
assert(
  await scalar(`
    SELECT count(*)::int = 1 AS value
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND cmd = 'SELECT'
      AND 'authenticated' = ANY(roles)
  `) === true,
  'Owner-only subscription SELECT policy is missing.'
);
assert(
  await scalar(`
    SELECT count(*)::int = 1 AS value
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND cmd = 'UPDATE'
      AND 'authenticated' = ANY(roles)
  `) === true,
  'Owner-only subscription UPDATE policy is missing.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_access_credentials', 'SELECT') AS value`) === false,
  'Authenticated role can read password hashes.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_rule_configs', 'SELECT') AS value`) === false,
  'Authenticated clients can read private agent rules directly.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_rule_config_versions', 'SELECT') AS value`) === false,
  'Authenticated clients can read private rule history directly.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_security_events', 'SELECT') AS value`) === false,
  'Authenticated clients can read private security events directly.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_config_drafts', 'SELECT') AS value`) === false,
  'Authenticated clients can bypass the staged publishing API.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.agent_publish_versions', 'SELECT') AS value`) === false,
  'Authenticated clients can read private publish snapshots directly.'
);
assert(
  await scalar(`SELECT has_table_privilege('authenticated', 'public.widget_installations', 'SELECT') AS value`) === false,
  'Authenticated clients can read private widget-installation configuration directly.'
);
for (const table of ['profiles_public_data', 'agent_configs_public_data']) {
  assert(
    await scalar(`SELECT has_table_privilege('authenticated', 'public.${table}', 'SELECT') AS value`) === true,
    `Authenticated clients cannot read ${table}.`
  );
  assert(
    await scalar(`SELECT has_table_privilege('authenticated', 'public.${table}', 'UPDATE') AS value`) === false,
    `Authenticated clients can write ${table}.`
  );
}

await db.close();

console.log(`Verified ${migrationFiles.length} migrations and all security invariants.`);
