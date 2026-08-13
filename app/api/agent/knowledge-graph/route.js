import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { createAdminClient, createClient } from '@/utils/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REVIEW_BYTES = 4_000;

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'knowledge-graph-read', 60, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedStatus = new URL(request.url).searchParams.get('status') || 'draft';
  const status = ['draft', 'unresolved', 'verified', 'excluded', 'superseded'].includes(requestedStatus)
    ? requestedStatus
    : 'draft';
  const admin = createAdminClient();
  const { data: claims, error } = await admin
    .from('agent_knowledge_claims')
    .select('id, subject_entity_id, predicate, object_entity_id, object_value, statement, evidence_status, confidence, verified_at, review_note, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('evidence_status', status)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Unable to load connected knowledge' }, { status: 500 });
  if (!claims?.length) return NextResponse.json({ claims: [], contradictions: [] });

  const claimIds = claims.map((claim) => claim.id);
  const entityIds = [...new Set(claims.flatMap((claim) => [claim.subject_entity_id, claim.object_entity_id]).filter(Boolean))];
  const [entitiesResult, evidenceResult, contradictionsResult] = await Promise.all([
    admin.from('agent_knowledge_entities').select('id, canonical_name, entity_type, evidence_status').eq('user_id', user.id).in('id', entityIds),
    admin.from('agent_knowledge_claim_evidence').select('claim_id, source_chunk_id, excerpt').eq('user_id', user.id).in('claim_id', claimIds).limit(1000),
    admin.from('agent_knowledge_contradictions').select('id, left_claim_id, right_claim_id, status, reason, resolution_note, detected_at').eq('user_id', user.id).order('detected_at', { ascending: false }).limit(500),
  ]);
  if (entitiesResult.error || evidenceResult.error || contradictionsResult.error) {
    return NextResponse.json({ error: 'Unable to load connected knowledge evidence' }, { status: 500 });
  }
  const entities = entitiesResult.data || [];
  const evidence = evidenceResult.data || [];
  const contradictions = contradictionsResult.data || [];

  const chunkIds = [...new Set((evidence || []).map((item) => item.source_chunk_id))];
  const { data: chunks, error: chunksError } = chunkIds.length
    ? await admin.from('agent_knowledge_chunks').select('id, source_title, source_type, source_url, verified_at').eq('user_id', user.id).in('id', chunkIds)
    : { data: [], error: null };
  if (chunksError) return NextResponse.json({ error: 'Unable to load connected knowledge sources' }, { status: 500 });
  const entitiesById = new Map((entities || []).map((entity) => [entity.id, entity]));
  const chunksById = new Map((chunks || []).map((chunk) => [chunk.id, chunk]));
  const evidenceByClaim = new Map();
  for (const item of evidence || []) {
    const values = evidenceByClaim.get(item.claim_id) || [];
    values.push({ ...item, source: chunksById.get(item.source_chunk_id) || null });
    evidenceByClaim.set(item.claim_id, values);
  }

  return NextResponse.json({
    claims: claims.map((claim) => ({
      ...claim,
      subject: entitiesById.get(claim.subject_entity_id) || null,
      object: claim.object_entity_id ? entitiesById.get(claim.object_entity_id) || null : claim.object_value,
      evidence: evidenceByClaim.get(claim.id) || [],
    })),
    contradictions: contradictions.filter((item) => claimIds.includes(item.left_claim_id) || claimIds.includes(item.right_claim_id)),
  });
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'knowledge-graph-review', 30, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawBody = await request.text();
  if (rawBody.length > MAX_REVIEW_BYTES) {
    return NextResponse.json({ error: 'Review request is too large' }, { status: 413 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const claimId = typeof payload?.claimId === 'string' ? payload.claimId : '';
  const decision = typeof payload?.decision === 'string' ? payload.decision : '';
  const resolutionNote = typeof payload?.resolutionNote === 'string' ? payload.resolutionNote.trim().slice(0, 1000) : '';
  if (!UUID_PATTERN.test(claimId) || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid claim review action' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: ownedClaim, error: ownershipError } = await admin
    .from('agent_knowledge_claims')
    .select('id')
    .eq('id', claimId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (ownershipError || !ownedClaim) return NextResponse.json({ error: 'Connected claim not found' }, { status: 404 });

  const { data, error } = await admin.rpc('review_agent_knowledge_claim', {
    p_owner_id: user.id,
    p_claim_id: claimId,
    p_decision: decision,
    p_resolution_note: resolutionNote || null,
  });
  if (error) {
    const needsResolution = error.message?.includes('resolution note');
    return NextResponse.json({
      error: needsResolution ? 'Explain which contradictory claim is correct before approving it' : 'Unable to review connected claim',
    }, { status: needsResolution ? 409 : 400 });
  }
  return NextResponse.json({ success: true, review: data });
}
