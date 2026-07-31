import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { isSubscriptionLive } from '@/lib/plans';
import { rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeWidgetInput } from '@/lib/widget-installations';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

async function loadOwnerContext(admin, userId) {
  const [{ data: agentConfig, error: configError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from('agent_configs').select('id, agent_name, agent_avatar, welcome_message, primary_color, access_level').eq('user_id', userId).maybeSingle(),
    admin.from('subscriptions').select('tier, status, trial_ends_at').eq('user_id', userId).maybeSingle(),
  ]);
  if (configError || subscriptionError) return { error: 'Unable to verify the agent and subscription.' };
  if (!agentConfig) return { error: 'Finish creating your Qlynk Agent before adding a widget.', status: 409 };
  return { agentConfig, subscription, isLive: isSubscriptionLive(subscription) };
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'widget-installation-read', 60, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const context = await loadOwnerContext(admin, user.id);
  if (context.error) {
    return NextResponse.json({ error: context.error }, { status: context.status || 500 });
  }

  const { data: widget, error } = await admin
    .from('widget_installations')
    .select('id, name, is_enabled, allowed_origins, position, launcher_color, created_at, updated_at')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load the website widget.' }, { status: 500 });

  return NextResponse.json({
    widget: widget || null,
    agent: context.agentConfig,
    subscription: {
      tier: context.subscription?.tier || null,
      is_live: context.isLive,
    },
  });
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'widget-installation-create', 10, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = sanitizeWidgetInput(await request.json().catch(() => null));
  if (input.error) return NextResponse.json({ error: input.error }, { status: 400 });

  const admin = createAdminClient();
  const context = await loadOwnerContext(admin, user.id);
  if (context.error) {
    return NextResponse.json({ error: context.error }, { status: context.status || 500 });
  }
  if (!context.isLive) {
    return NextResponse.json({ error: 'Activate a live plan before creating a website widget.' }, { status: 403 });
  }

  const { data: existing } = await admin
    .from('widget_installations')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'This agent already has a website widget.' }, { status: 409 });
  }

  const { data: widget, error } = await admin
    .from('widget_installations')
    .insert({
      owner_id: user.id,
      agent_config_id: context.agentConfig.id,
      ...input.value,
    })
    .select('id, name, is_enabled, allowed_origins, position, launcher_color, created_at, updated_at')
    .single();
  if (error || !widget) {
    return NextResponse.json({ error: 'Unable to create the website widget.' }, { status: 500 });
  }
  return NextResponse.json({ widget }, { status: 201 });
}

export async function PUT(request) {
  const limited = await rateLimitResponse(request, 'widget-installation-update', 30, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = sanitizeWidgetInput(await request.json().catch(() => null));
  if (input.error) return NextResponse.json({ error: input.error }, { status: 400 });

  const admin = createAdminClient();
  const context = await loadOwnerContext(admin, user.id);
  if (context.error) {
    return NextResponse.json({ error: context.error }, { status: context.status || 500 });
  }
  if (!context.isLive) {
    return NextResponse.json({ error: 'Activate a live plan before publishing widget changes.' }, { status: 403 });
  }

  const updatedAt = new Date().toISOString();
  const { data: widget, error } = await admin
    .from('widget_installations')
    .update({ ...input.value, updated_at: updatedAt })
    .eq('owner_id', user.id)
    .select('id, name, is_enabled, allowed_origins, position, launcher_color, created_at, updated_at')
    .maybeSingle();
  if (error || !widget) {
    return NextResponse.json({ error: 'Unable to update the website widget.' }, { status: error ? 500 : 404 });
  }
  return NextResponse.json({ widget });
}
