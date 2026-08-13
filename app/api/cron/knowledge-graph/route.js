import { authorizeCronRequest } from '@/lib/cron-auth';
import { isKnowledgeGraphEnabled, processPendingKnowledgeGraph } from '@/lib/knowledge-graph';
import { createAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;

  if (!isKnowledgeGraphEnabled()) {
    return Response.json({ success: true, enabled: false, claimed: 0, stored: 0 });
  }

  try {
    const totals = await processPendingKnowledgeGraph({
      supabase: createAdminClient(),
      limit: 6,
    });
    return Response.json({ success: true, ...totals });
  } catch (error) {
    console.error('[Knowledge Graph Cron] Failed:', error);
    return Response.json({ error: 'Knowledge graph processing failed' }, { status: 503 });
  }
}
