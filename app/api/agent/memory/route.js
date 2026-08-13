import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateExplicitMemoryInput } from '@/lib/knowledge-memory-input';
import { rateLimitResponse } from '@/lib/rate-limit';
import { createAdminClient, createClient } from '@/utils/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MEMORY_BYTES = 8_000;
const ITEM_TABLES = {
  pattern: 'agent_memory_patterns',
  preference: 'agent_memory_preferences',
  observation: 'agent_memory_observations',
};
const ITEM_SELECTS = {
  pattern: 'id, entity_id, pattern_type, title, summary, evidence_status, consent_basis, support_count, confidence, window_start, window_end, inferred_at, expires_at, reviewed_at, review_note, created_at, updated_at',
  preference: 'id, entity_id, preference_key, preference_value, evidence_status, consent_basis, consent_status, confidence, expires_at, verified_at, reviewed_at, revoked_at, review_note, created_at, updated_at',
  observation: 'id, entity_id, source_kind, observation_type, observation_key, observed_value, occurred_at, valid_until, expires_at, evidence_status, consent_basis, confidence, reviewed_at, review_note, created_at, updated_at',
};

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

function parseOptionalDate(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'agent-memory-read', 60, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const itemType = ITEM_TABLES[params.get('type')] ? params.get('type') : 'pattern';
  const requestedStatus = params.get('status') || 'draft';
  const status = ['verified', 'draft', 'unresolved', 'excluded'].includes(requestedStatus) ? requestedStatus : 'draft';
  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from(ITEM_TABLES[itemType])
    .select(ITEM_SELECTS[itemType])
    .eq('user_id', user.id)
    .eq('evidence_status', status)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Unable to load temporal memory' }, { status: 500 });

  const { data: entities, error: entitiesError } = await admin
    .from('agent_knowledge_entities')
    .select('id, canonical_name, entity_type')
    .eq('user_id', user.id)
    .eq('evidence_status', 'verified')
    .order('canonical_name')
    .limit(500);
  if (entitiesError) return NextResponse.json({ error: 'Unable to load memory entities' }, { status: 500 });

  const entitiesById = new Map((entities || []).map((entity) => [entity.id, entity]));
  const supportByPattern = new Map();
  if (itemType === 'pattern' && items?.length) {
    const patternIds = items.map((item) => item.id);
    const { data: supports, error: supportError } = await admin
      .from('agent_memory_pattern_support')
      .select('pattern_id, observation_id, knowledge_gap_id')
      .eq('user_id', user.id)
      .in('pattern_id', patternIds)
      .limit(1000);
    if (supportError) return NextResponse.json({ error: 'Unable to load pattern support' }, { status: 500 });

    const observationIds = [...new Set((supports || []).map((support) => support.observation_id).filter(Boolean))];
    const gapIds = [...new Set((supports || []).map((support) => support.knowledge_gap_id).filter(Boolean))];
    const [observationResult, gapResult] = await Promise.all([
      observationIds.length
        ? admin.from('agent_memory_observations').select('id, observation_type, observation_key, observed_value, occurred_at, evidence_status').eq('user_id', user.id).in('id', observationIds)
        : Promise.resolve({ data: [], error: null }),
      gapIds.length
        ? admin.from('agent_knowledge_gaps').select('id, question, occurrence_count, status, last_seen_at').eq('user_id', user.id).in('id', gapIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (observationResult.error || gapResult.error) {
      return NextResponse.json({ error: 'Unable to load pattern evidence' }, { status: 500 });
    }
    const observationsById = new Map((observationResult.data || []).map((item) => [item.id, item]));
    const gapsById = new Map((gapResult.data || []).map((item) => [item.id, item]));
    for (const support of supports || []) {
      const values = supportByPattern.get(support.pattern_id) || [];
      const evidence = support.observation_id
        ? { kind: 'observation', ...(observationsById.get(support.observation_id) || {}) }
        : { kind: 'aggregate_gap', ...(gapsById.get(support.knowledge_gap_id) || {}) };
      values.push(evidence);
      supportByPattern.set(support.pattern_id, values);
    }
  }

  return NextResponse.json({
    itemType,
    status,
    entities: entities || [],
    items: (items || [])
      .filter((item) => itemType !== 'pattern' || item.pattern_type !== 'intent_cluster' || item.support_count >= 2)
      .map((item) => ({
        ...item,
        entity: item.entity_id ? entitiesById.get(item.entity_id) || null : null,
        support_evidence: itemType === 'pattern' ? supportByPattern.get(item.id) || [] : undefined,
      })),
  });
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'agent-memory-write', 30, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawBody = await request.text();
  if (rawBody.length > MAX_MEMORY_BYTES) return NextResponse.json({ error: 'Memory request is too large' }, { status: 413 });

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (payload?.action === 'observe' || payload?.action === 'preference') {
    if (payload.consentConfirmed !== true || !UUID_PATTERN.test(payload.entityId || '')) {
      return NextResponse.json({ error: 'Explicit owner confirmation and a valid entity are required' }, { status: 400 });
    }
    const expiresAt = parseOptionalDate(payload.expiresAt);
    if (expiresAt === undefined) return NextResponse.json({ error: 'Invalid expiry date' }, { status: 400 });
    const memoryInput = validateExplicitMemoryInput(payload.key, payload.value);
    if (memoryInput.error) return NextResponse.json({ error: memoryInput.error }, { status: 400 });

    const { data: entity, error: entityError } = await admin
      .from('agent_knowledge_entities')
      .select('id')
      .eq('id', payload.entityId)
      .eq('user_id', user.id)
      .eq('evidence_status', 'verified')
      .maybeSingle();
    if (entityError || !entity) return NextResponse.json({ error: 'Verified memory entity not found' }, { status: 404 });

    if (payload.action === 'observe') {
      const occurredAt = parseOptionalDate(payload.occurredAt);
      if (!occurredAt) return NextResponse.json({ error: 'A valid observation date is required' }, { status: 400 });
      const { data, error } = await admin.rpc('record_agent_memory_observation', {
        p_owner_id: user.id,
        p_entity_id: entity.id,
        p_observation_type: String(payload.observationType || '').slice(0, 40),
        p_observation_key: memoryInput.key,
        p_observed_value: memoryInput.value,
        p_occurred_at: occurredAt,
        p_expires_at: expiresAt,
      });
      if (error) return NextResponse.json({ error: 'Unable to record observation' }, { status: 400 });
      return NextResponse.json({ success: true, id: data, status: 'verified' });
    }

    const { data, error } = await admin.rpc('record_agent_memory_preference', {
      p_owner_id: user.id,
      p_entity_id: entity.id,
      p_preference_key: memoryInput.key,
      p_preference_value: memoryInput.value,
      p_expires_at: expiresAt,
    });
    if (error) return NextResponse.json({ error: 'Unable to record preference' }, { status: 400 });
    return NextResponse.json({ success: true, id: data, status: 'verified' });
  }

  if (payload?.action === 'review') {
    const itemType = typeof payload.itemType === 'string' ? payload.itemType : '';
    const itemId = typeof payload.itemId === 'string' ? payload.itemId : '';
    const decision = typeof payload.decision === 'string' ? payload.decision : '';
    if (!ITEM_TABLES[itemType] || !UUID_PATTERN.test(itemId) || !['approve', 'reject', 'revoke'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid memory review action' }, { status: 400 });
    }
    const { data: ownedItem, error: ownershipError } = await admin
      .from(ITEM_TABLES[itemType])
      .select('id')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ownershipError || !ownedItem) return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });

    const { data, error } = await admin.rpc('review_agent_memory_item', {
      p_owner_id: user.id,
      p_item_type: itemType,
      p_item_id: itemId,
      p_decision: decision,
      p_review_note: typeof payload.reviewNote === 'string' ? payload.reviewNote.trim().slice(0, 1000) || null : null,
    });
    if (error) return NextResponse.json({ error: 'Unable to review memory item' }, { status: 400 });
    return NextResponse.json({ success: true, review: data });
  }

  return NextResponse.json({ error: 'Unsupported memory action' }, { status: 400 });
}
