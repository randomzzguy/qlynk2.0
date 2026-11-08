import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// A nonexistent owner cannot reserve credits. Its result distinguishes the
// obsolete lifetime counter from the monthly RPC without changing customer data.
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await admin.rpc('consume_agent_message_credit', {
  p_owner_id: randomUUID(),
  p_message_limit: 5000,
});
if (error) throw new Error(`Unable to verify monthly message quota: ${error.message}`);
const credit = data?.[0];
if (credit?.allowed !== false || credit.messages_used !== 0 || credit.remaining !== 0) {
  console.error('The database is running an obsolete message quota RPC. Apply 20261108010000_repair_monthly_message_quota.sql before deploying the app.');
  process.exitCode = 1;
} else {
  console.log('Monthly message quota RPC is installed. No customer records were changed.');
}
