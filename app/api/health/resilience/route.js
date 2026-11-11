import { createAdminClient } from '@/utils/supabase/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { assessResilience } from '@/lib/resilience-monitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const client = createAdminClient();
    const { data, error } = await client.rpc('get_resilience_snapshot').abortSignal(AbortSignal.timeout(8000));
    if (error) throw error;
    const report = assessResilience(data);
    return Response.json(report, { status: report.status === 'ok' ? 200 : 503, headers });
  } catch {
    return Response.json({ status: 'unavailable', error: 'Resilience checks are unavailable. Verify migrations, access and monitoring configuration.' }, { status: 503, headers });
  }
}
