import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();

const db = await PGlite.create({ extensions: { pgcrypto } });

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

const profilePublicColumns = await db.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles_public'
`);
assert(
  !profilePublicColumns.rows.some((row) => row.column_name.startsWith('account_deletion_')),
  'Public profile view exposes account deletion fields.'
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
  agent_conversations: 1,
  agent_messages: 1,
  page_views: 1,
  subscriptions: 2,
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
  'agent_conversations',
  'agent_messages',
  'agent_access_credentials',
  'profiles',
  'subscriptions',
  'stripe_webhook_events',
  'api_rate_limits',
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
for (const table of ['agent_configs', 'agent_knowledge', 'profiles', 'subscriptions', 'stripe_webhook_events', 'api_rate_limits']) {
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

for (const statement of [
  `INSERT INTO public.agent_conversations (agent_owner_id, visitor_id)
   VALUES ('${fixtureUserId}', 'anonymous-write')`,
  `INSERT INTO public.agent_messages (conversation_id, role, content)
   VALUES ('22222222-2222-4222-8222-222222222222', 'user', 'anonymous-write')`,
  `INSERT INTO public.page_views (page_owner_id, visitor_id)
   VALUES ('${fixtureUserId}', 'anonymous-write')`,
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
await db.exec('SET ROLE service_role;');
const limiterKey = 'a'.repeat(64);
const firstLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
const secondLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
const thirdLimit = await db.query(`SELECT * FROM public.check_api_rate_limit('verification', '${limiterKey}', 2, 60)`);
assert(firstLimit.rows[0]?.allowed === true && firstLimit.rows[0]?.remaining === 1, 'First shared rate-limit request is incorrect.');
assert(secondLimit.rows[0]?.allowed === true && secondLimit.rows[0]?.remaining === 0, 'Second shared rate-limit request is incorrect.');
assert(thirdLimit.rows[0]?.allowed === false && thirdLimit.rows[0]?.remaining === 0, 'Shared rate limiter did not block excess traffic.');
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

await db.close();

console.log(`Verified ${migrationFiles.length} migrations and all security invariants.`);
