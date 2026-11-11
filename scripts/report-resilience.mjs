import { createClient } from '@supabase/supabase-js';
import { assessResilience } from '../lib/resilience-monitor.js';
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.rpc('get_resilience_snapshot').abortSignal(AbortSignal.timeout(10000));
if (error) throw new Error('Resilience checks unavailable. Apply 20261111040000_add_resilience_snapshot.sql and verify access.');
const report = assessResilience(data);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'ok') process.exitCode = 1;
