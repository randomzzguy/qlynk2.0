import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { DEFAULT_AGENT_TYPE } from '@/lib/agent-type-catalog';
import { normalizeAgentRules, validateAgentRulesPayload } from '@/lib/agent-rules';

const MAX_RULE_REQUEST_BYTES = 32_000;

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

async function readJsonBody(request) {
  const rawBody = await request.text();
  if (rawBody.length > MAX_RULE_REQUEST_BYTES) {
    return { error: 'Agent rules request is too large.', status: 413 };
  }

  try {
    return { body: JSON.parse(rawBody) };
  } catch {
    return { error: 'Invalid JSON body.', status: 400 };
  }
}

async function loadRuleConfiguration(adminSupabase, userId) {
  const securitySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { data: config, error: configError },
    { data: rules, error: rulesError },
    { data: versions, error: versionsError },
    { data: securityEvents, error: securityEventsError },
  ] = await Promise.all([
    adminSupabase
      .from('agent_configs')
      .select('agent_type')
      .eq('user_id', userId)
      .maybeSingle(),
    adminSupabase
      .from('agent_rule_configs')
      .select('purpose, audience, allowed_topics, blocked_topics, behavior_rules, forbidden_behaviors, uncertainty_message, escalation_message, custom_instructions, response_length, scope_mode, daily_message_limit, prompt_version, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    adminSupabase
      .from('agent_rule_config_versions')
      .select('version, agent_type, created_at')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(10),
    adminSupabase
      .from('agent_security_events')
      .select('event_type, created_at')
      .eq('agent_owner_id', userId)
      .gte('created_at', securitySince)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (configError || rulesError || versionsError || securityEventsError) {
    throw configError || rulesError || versionsError || securityEventsError;
  }

  const agentType = config?.agent_type || DEFAULT_AGENT_TYPE;
  const securitySummary = (securityEvents || []).reduce((summary, event) => {
    summary.total += 1;
    summary[event.event_type] = (summary[event.event_type] || 0) + 1;
    if (!summary.last_event_at) summary.last_event_at = event.created_at;
    return summary;
  }, { total: 0, prompt_injection: 0, off_topic: 0, safety: 0, last_event_at: null });
  return {
    agent_type: agentType,
    rules: normalizeAgentRules(rules || {}, agentType),
    configured: Boolean(rules),
    prompt_version: rules?.prompt_version || 0,
    updated_at: rules?.updated_at || null,
    versions: versions || [],
    security_summary: securitySummary,
  };
}

export async function GET(request) {
  const rateLimit = await rateLimitResponse(request, 'agent-rules-read', 60, 60 * 1000);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    return NextResponse.json(await loadRuleConfiguration(createAdminClient(), user.id));
  } catch (error) {
    console.error('[Agent Rules] Failed to load configuration:', error.message);
    return NextResponse.json({ error: 'Unable to load agent rules.' }, { status: 500 });
  }
}

export async function POST(request) {
  const rateLimit = await rateLimitResponse(request, 'agent-rules-write', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = await readJsonBody(request);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

  const validated = validateAgentRulesPayload(parsed.body);
  if (validated.error) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: promptVersion, error } = await adminSupabase.rpc('save_agent_rule_config', {
    p_owner_id: user.id,
    p_agent_type: validated.agentType,
    p_rules: validated.rules,
  });

  if (error) {
    console.error('[Agent Rules] Failed to save configuration:', error.message);
    return NextResponse.json({ error: 'Unable to save agent rules.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    agent_type: validated.agentType,
    rules: validated.rules,
    prompt_version: promptVersion,
  });
}

export async function PUT(request) {
  const rateLimit = await rateLimitResponse(request, 'agent-rules-restore', 10, 60 * 1000);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = await readJsonBody(request);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

  const requestedVersion = Number(parsed.body?.version);
  if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
    return NextResponse.json({ error: 'Choose a valid prompt version.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: snapshot, error: snapshotError } = await adminSupabase
    .from('agent_rule_config_versions')
    .select('agent_type, rules')
    .eq('user_id', user.id)
    .eq('version', requestedVersion)
    .maybeSingle();

  if (snapshotError || !snapshot) {
    return NextResponse.json({ error: 'Prompt version not found.' }, { status: 404 });
  }

  const validated = validateAgentRulesPayload({
    agent_type: snapshot.agent_type,
    rules: snapshot.rules,
  });
  if (validated.error) {
    return NextResponse.json({ error: 'Stored prompt version is no longer valid.' }, { status: 409 });
  }

  const { data: promptVersion, error } = await adminSupabase.rpc('save_agent_rule_config', {
    p_owner_id: user.id,
    p_agent_type: validated.agentType,
    p_rules: validated.rules,
  });

  if (error) {
    console.error('[Agent Rules] Failed to restore configuration:', error.message);
    return NextResponse.json({ error: 'Unable to restore agent rules.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    restored_from: requestedVersion,
    prompt_version: promptVersion,
    agent_type: validated.agentType,
    rules: validated.rules,
  });
}
