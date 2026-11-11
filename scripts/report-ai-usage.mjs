import { createClient } from '@supabase/supabase-js';
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await client.rpc('get_ai_usage_summary');
if (error) throw new Error('AI usage reporting is unavailable. Apply the usage/sentiment migration first.');
console.log('Last 24 hours of admitted calls. Measurements may be missing for failed, interrupted, or unreported calls; they are not zero-token calls.');
console.table((data || []).map(row => ({
  scope: row.scope, model: row.model, workload: row.workload,
  calls: Number(row.requests), measured: Number(row.measured_requests),
  reservedTokens: Number(row.estimated_tokens),
  estimatedForMeasuredCalls: Number(row.measured_estimated_tokens),
  actualInput: Number(row.prompt_tokens), actualOutput: Number(row.completion_tokens),
  cachedInput: Number(row.cached_tokens),
})));
console.log('Admission still uses the original estimates. This report does not change quotas and does not include message contents or credentials.');
