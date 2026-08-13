import { authorizeCronRequest } from '@/lib/cron-auth';
import { isKnowledgeEmbeddingsEnabled, processPendingKnowledgeEmbeddings } from '@/lib/knowledge-embeddings';
import { createAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;

  if (!isKnowledgeEmbeddingsEnabled()) {
    return Response.json({ success: true, enabled: false, claimed: 0, stored: 0 });
  }

  try {
    const supabase = createAdminClient();
    const totals = { claimed: 0, stored: 0 };

    for (let batch = 0; batch < 4; batch += 1) {
      const result = await processPendingKnowledgeEmbeddings({ supabase, limit: 16 });
      totals.claimed += result.claimed;
      totals.stored += result.stored;
      if (result.claimed < 16) break;
    }

    return Response.json({ success: true, enabled: true, ...totals });
  } catch (error) {
    console.error('[Knowledge Embeddings Cron] Failed:', error);
    return Response.json({ error: 'Knowledge embedding processing failed' }, { status: 503 });
  }
}
