import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ChatWidget from '@/components/ChatWidget';
import { isSubscriptionLive } from '@/lib/plans';
import { isWidgetId } from '@/lib/widget-installations';

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params }) {
  const { username: identifier } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const adminSupabase = createAdminClient();

  let widget = null;
  let profile = null;
  let agentConfig = null;
  let subscription = null;
  let username = identifier;

  if (isWidgetId(identifier)) {
    const { data: installation } = await adminSupabase
      .from('widget_installations')
      .select('id, owner_id, agent_config_id, is_enabled, allowed_origins, position, launcher_color, pre_chat_enabled, pre_chat_email_enabled, pre_chat_email_required, pre_chat_intro')
      .eq('id', identifier)
      .eq('is_enabled', true)
      .maybeSingle();
    if (!installation) return null;

    const [{ data: privateConfig }, { data: ownerProfile }, { data: ownerSubscription }] = await Promise.all([
      adminSupabase
        .from('agent_configs')
        .select('id, user_id, agent_name, agent_avatar, welcome_message, primary_color, access_level, agent_type, chat_bg_color, user_bubble_color, ai_bubble_color, cta_button_color, cta_text_color, gatekeeper_text_color, font_family, is_enabled')
        .eq('id', installation.agent_config_id)
        .eq('user_id', installation.owner_id)
        .maybeSingle(),
      adminSupabase.from('profiles').select('id, username').eq('id', installation.owner_id).maybeSingle(),
      adminSupabase
        .from('subscriptions')
        .select('tier, status, trial_ends_at, post_trial_choice')
        .eq('user_id', installation.owner_id)
        .maybeSingle(),
    ]);
    if (!privateConfig?.is_enabled || !ownerProfile?.username) return null;
    widget = installation;
    profile = ownerProfile;
    agentConfig = privateConfig;
    subscription = ownerSubscription;
    username = ownerProfile.username;
  }

  if (!profile) {
    const { data: publicProfile } = await supabase
      .from('profiles_public')
      .select('id, username')
      .eq('username', username)
      .single();
    profile = publicProfile;
  }

  if (!profile) {
    return null;
  }

  if (!agentConfig) {
    const [{ data: publicConfig }, { data: publicSubscription }] = await Promise.all([
      supabase
        .from('agent_configs_public')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_enabled', true)
        .single(),
      adminSupabase
        .from('subscriptions')
        .select('tier, status, trial_ends_at, post_trial_choice')
        .eq('user_id', profile.id)
        .maybeSingle(),
    ]);
    agentConfig = publicConfig;
    subscription = publicSubscription;
  }

  if (!agentConfig) {
    return null;
  }

  if (!isSubscriptionLive(subscription)) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-transparent flex items-end justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <ChatWidget 
          username={username}
          agentName={agentConfig.agent_name}
          agentAvatar={agentConfig.agent_avatar}
          welcomeMessage={agentConfig.welcome_message}
          primaryColor={widget?.launcher_color || agentConfig.primary_color}
          position={widget?.position || agentConfig.position}
          accessLevel={agentConfig.access_level}
          agentType={agentConfig.agent_type}
          chatBgColor={agentConfig.chat_bg_color}
          userBubbleColor={agentConfig.user_bubble_color}
          aiBubbleColor={agentConfig.ai_bubble_color}
          ctaButtonColor={agentConfig.cta_button_color}
          ctaTextColor={agentConfig.cta_text_color}
          gatekeeperTextColor={agentConfig.gatekeeper_text_color}
          fontFamily={agentConfig.font_family}
          tier={subscription?.tier}
          widgetId={widget?.id || null}
          allowedOrigins={widget?.allowed_origins || []}
          preChatEnabled={widget?.pre_chat_enabled === true}
          preChatEmailEnabled={widget?.pre_chat_email_enabled !== false}
          preChatEmailRequired={widget?.pre_chat_email_required === true}
          preChatIntro={widget?.pre_chat_intro}
        />
      </div>
    </div>
  );
}
