import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEditableAgentConfig } from '@/lib/agent-config';
import { validateAgentRulesPayload } from '@/lib/agent-rules';

const MAX_DRAFT_BYTES = 96_000;

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'agent-draft-read', 60, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from('agent_config_drafts')
    .select('config, rules, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to load the draft.' }, { status: 500 });
  return NextResponse.json({ draft: data || null });
}

export async function PUT(request) {
  const limited = await rateLimitResponse(request, 'agent-draft-write', 30, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawBody = await request.text();
  if (rawBody.length > MAX_DRAFT_BYTES) {
    return NextResponse.json({ error: 'This draft is too large.' }, { status: 413 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const config = sanitizeEditableAgentConfig(payload?.config);
  if (!config) return NextResponse.json({ error: 'Invalid agent configuration.' }, { status: 400 });

  const validated = validateAgentRulesPayload({
    agent_type: config.agent_type,
    rules: payload?.rules,
  });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  const updatedAt = new Date().toISOString();
  const { error } = await createAdminClient()
    .from('agent_config_drafts')
    .upsert({
      user_id: user.id,
      config,
      rules: validated.rules,
      updated_at: updatedAt,
    }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: 'Unable to save the draft.' }, { status: 500 });
  return NextResponse.json({ success: true, updated_at: updatedAt, config, rules: validated.rules });
}

export async function DELETE(request) {
  const limited = await rateLimitResponse(request, 'agent-draft-delete', 20, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await createAdminClient()
    .from('agent_config_drafts')
    .delete()
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Unable to clear the draft.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
