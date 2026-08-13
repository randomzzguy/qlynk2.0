import { authorizeCronRequest } from '@/lib/cron-auth';
import { isKnowledgeMemoryEnabled, processKnowledgeMemory } from '@/lib/knowledge-memory';
import { createAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;

  if (!isKnowledgeMemoryEnabled()) {
    return Response.json({ success: true, enabled: false });
  }

  try {
    const result = await processKnowledgeMemory({ supabase: createAdminClient(), limit: 16 });
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('[Knowledge Memory Cron] Failed:', error);
    return Response.json({ error: 'Knowledge memory processing failed' }, { status: 503 });
  }
}
