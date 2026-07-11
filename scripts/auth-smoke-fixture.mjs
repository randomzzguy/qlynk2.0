import { randomBytes } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const mode = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

if (mode === 'delete') {
  const userId = process.argv[3];
  if (!userId) throw new Error('Missing fixture user ID');
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
  console.log('deleted');
} else if (mode === 'create') {
  const suffix = randomBytes(5).toString('hex');
  const email = `preview-auth-smoke-${suffix}@example.invalid`;
  const password = `Qlynk-Preview-${randomBytes(18).toString('base64url')}!`;
  const username = `preview_${suffix}`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, launch_smoke_fixture: true },
  });
  if (createError) throw createError;

  const cookieJar = [];
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieJar,
      setAll: (newCookies) => {
        for (const cookie of newCookies) {
          const existing = cookieJar.findIndex((entry) => entry.name === cookie.name);
          if (existing >= 0) cookieJar.splice(existing, 1);
          if (cookie.value) cookieJar.push(cookie);
        }
      },
    },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw signInError;
  }

  console.log(JSON.stringify({
    userId: created.user.id,
    cookie: cookieJar.map(({ name, value }) => `${name}=${value}`).join('; '),
  }));
} else {
  throw new Error('Use create or delete mode');
}
