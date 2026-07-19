import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { AGENT_CONFIG_SNAPSHOT_SELECT, sanitizeEditableAgentConfig } from '@/lib/agent-config';
import { normalizeAgentRules } from '@/lib/agent-rules';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'agent-publish-snapshot', 20, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: config, error: configError }, { data: ruleRow, error: rulesError }] = await Promise.all([
    admin.from('agent_configs').select(AGENT_CONFIG_SNAPSHOT_SELECT).eq('user_id', user.id).maybeSingle(),
    admin.from('agent_rule_configs').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  if (configError || rulesError || !config) {
    return NextResponse.json({ error: 'Unable to verify the published agent.' }, { status: 500 });
  }

  const safeConfig = sanitizeEditableAgentConfig(config);
  const safeRules = normalizeAgentRules(ruleRow || {}, safeConfig.agent_type);
  const { data: latest } = await admin
    .from('agent_publish_versions')
    .select('version')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version || 0) + 1;

  const { error: snapshotError } = await admin
    .from('agent_publish_versions')
    .insert({ user_id: user.id, version, config: safeConfig, rules: safeRules });
  if (snapshotError) {
    return NextResponse.json({ error: 'Changes were published, but the version snapshot failed.' }, { status: 500 });
  }

  const { data: olderVersions } = await admin
    .from('agent_publish_versions')
    .select('id')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .range(25, 1000);
  if (olderVersions?.length) {
    await admin
      .from('agent_publish_versions')
      .delete()
      .in('id', olderVersions.map((item) => item.id));
  }

  await admin.from('agent_config_drafts').delete().eq('user_id', user.id);
  return NextResponse.json({ success: true, version });
}
