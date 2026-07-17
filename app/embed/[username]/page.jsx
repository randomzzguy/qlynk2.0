import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ChatWidget from '@/components/ChatWidget';
import { isAgentLive } from '@/lib/subscriptionHelpers';

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params, searchParams }) {
  const { username } = await params;
  const { parentOrigin: requestedParentOrigin } = await searchParams;
  let parentOrigin = null;
  if (typeof requestedParentOrigin === 'string') {
    try {
      const parsedOrigin = new URL(requestedParentOrigin);
      if (['http:', 'https:'].includes(parsedOrigin.protocol)) {
        parentOrigin = parsedOrigin.origin;
      }
    } catch {
      // The widget will fall back to document.referrer when possible.
    }
  }
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch page data from Supabase by joining with profiles
  const { data: profile } = await supabase
    .from('profiles_public')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) {
    return null;
  }

  // Fetch agent config
  const { data: agentConfig } = await supabase
    .from('agent_configs_public')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_enabled', true)
    .single();

  if (!agentConfig) {
    return null;
  }

  // Check if agent is live
  const adminSupabase = createAdminClient();
  const agentIsLive = await isAgentLive(profile.id, adminSupabase);

  if (!agentIsLive) {
    return null;
  }

  // Fetch subscription to check for white-labeling
  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', profile.id)
    .maybeSingle();

  return (
    <div className="fixed inset-0 bg-transparent flex items-end justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <ChatWidget 
          username={username}
          agentName={agentConfig.agent_name}
          agentAvatar={agentConfig.agent_avatar}
          welcomeMessage={agentConfig.welcome_message}
          primaryColor={agentConfig.primary_color}
          position={agentConfig.position}
          accessLevel={agentConfig.access_level}
          agentType={agentConfig.agent_type}
          tier={subscription?.tier}
          parentOrigin={parentOrigin}
        />
      </div>
    </div>
  );
}
