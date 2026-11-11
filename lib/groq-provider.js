import 'server-only';
import { createAdminClient } from '@/utils/supabase/server';
import { fetchWithGroqQuota } from './groq-quota.js';

export function fetchGroqWithQuota(body, options = {}) {
  return fetchWithGroqQuota(body, { ...options, client: createAdminClient() });
}
