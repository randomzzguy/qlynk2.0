import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ChatWidget from '@/components/ChatWidget';
import { isAgentLive } from '@/lib/subscriptionHelpers';

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params }) {
  const { username } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch page data from Supabase by joining with profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) {
    return null;
  }

  // Fetch agent config
  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_enabled', true)
    .single();

  if (!agentConfig) {
    return null;
  }

  // Check if agent is live
  const agentIsLive = await isAgentLive(profile.id);

  if (!agentIsLive) {
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
          primaryColor={agentConfig.primary_color}
          position={agentConfig.position}
        />
      </div>
    </div>
  );
}
