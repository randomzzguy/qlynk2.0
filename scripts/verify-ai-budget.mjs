import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getGroqBudget } from '../lib/groq-quota.js';
import { getGroqChatModel, getGroqFastModel, getGroqDemoModel, getGroqKnowledgeGraphModel } from '../lib/groq-models.js';

for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
for (const model of new Set([getGroqChatModel(), getGroqFastModel(), getGroqDemoModel(), getGroqKnowledgeGraphModel()])) {
  console.log(`Configured application budget for ${model}:`, getGroqBudget(model));
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Invalid arguments are rejected BEFORE any mutation. No actual inference,
// reservations, counters, cooldowns or customer data are created by this check.
const invalid = await admin.rpc('reserve_ai_provider_budget', {
  p_scope: 'readiness-probe', p_model: 'probe', p_request_id: randomUUID(), p_tokens: 0,
  p_rpm: 1, p_rpd: 1, p_tpm: 1, p_tpd: 1, p_concurrency: 1,
});
if (invalid.error?.code !== 'P0001' || invalid.error.message !== 'Invalid AI budget parameters') {
  throw new Error('Shared AI budget RPC is missing or incompatible. Apply 20261111020000_add_shared_groq_budgets.sql before deploying.');
}
const cooldown = await admin.rpc('cooldown_ai_provider_budget', { p_scope: 'readiness-probe', p_model: 'probe', p_seconds: 0 });
if (cooldown.error?.code !== 'P0001' || cooldown.error.message !== 'Invalid provider cooldown') {
  throw new Error('Shared AI cooldown RPC is missing or incompatible.');
}
const finish = await admin.rpc('finish_ai_provider_request', { p_request_id: randomUUID() });
if (finish.error) throw new Error('Shared AI slot release RPC is missing or incompatible.');
const usage = await admin.rpc('complete_ai_provider_request', { p_request_id: randomUUID(), p_workload: 'other', p_usage: null });
const summary = await admin.rpc('get_ai_usage_summary');
const sentiment = await admin.rpc('claim_agent_sentiment_check', { p_conversation_id: randomUUID(), p_claim_id: randomUUID() });
const sentimentFinish = await admin.rpc('finish_agent_sentiment_check', { p_conversation_id: randomUUID(), p_claim_id: randomUUID(), p_sentiment: 'neutral' });
if (usage.error || summary.error || sentiment.error || sentiment.data !== false || sentimentFinish.error || sentimentFinish.data !== false) {
  throw new Error('Usage/sentiment RPCs are missing or incompatible. Apply 20261111030000_add_ai_usage_and_sentiment_cadence.sql before deploying.');
}
console.log('Shared AI budget RPCs are installed. No records or provider quota were consumed. Confirm these configured limits against the Groq account separately.');
