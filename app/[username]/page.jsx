import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import FullPageChat from '@/components/FullPageChat';
import { isAgentLive } from '@/lib/subscriptionHelpers';

// This tells Next.js to generate pages dynamically
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { username } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('username', username)
    .single();

  if (!profile) {
    return {
      title: `${username} | Qlynk`,
      description: 'Create your own digital twin and AI representative.',
    };
  }

  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('agent_name, bio, agent_avatar')
    .eq('user_id', profile.id)
    .single();

  const title = `${profile.full_name || username} | Qlynk AI`;
  const description = agentConfig?.bio || `Chat with the digital twin of ${username}. Learn about their work, background, and expertise.`;
  const image = agentConfig?.agent_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicPage({ params }) {
  const { username } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch page data from Supabase by joining with profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .single();

  if (profileError || !profile) {
    // ... rest of the error state ...
    return (
      <div className="min-h-screen bg-[#0f0f14] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Techy background elements */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <QlynkBackground />
          <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-[#f46530]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="grid-overlay" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="w-24 h-24 bg-gray-800/50 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-700/50 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles className="text-[#f46530]" size={48} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
            @{username} is available!
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            This digital identity hasn&apos;t been claimed yet. Create your AI clone and secure this handle in seconds.
          </p>
          
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center gap-3 bg-[#f46530] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#f46530]/90 transition-all shadow-[0_10px_30px_rgba(244,101,48,0.3)] hover:-translate-y-1 active:scale-95"
          >
            Claim This Handle
            <ArrowRight size={22} />
          </Link>
        </div>
      </div>
    );
  }

  // 1. Fetch Page Data (Bio, Tagline, etc)
  const { data: pageData } = await supabase
    .from('pages')
    .select('*, social_links(*), custom_links(*)')
    .eq('user_id', profile.id)
    .single();

  // 2. Fetch Agent Config
  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', profile.id)
    .single();

  const adminSupabase = createAdminClient();
  const agentIsLive = await isAgentLive(profile.id, adminSupabase);

  if (!agentIsLive || !agentConfig?.is_enabled) {
    // ... (keep the offline state logic) ...
    return (
      <div className="min-h-screen bg-[#0f0f14] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <QlynkBackground />
          <div className="grid-overlay" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="w-24 h-24 bg-gray-800/40 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#f46530]/30 shadow-[0_0_50px_rgba(244,101,48,0.15)]">
            <Lock className="text-[#f46530]" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">q-agent Offline</h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">This q-agent is currently in maintenance.</p>
          <Link href="/" className="inline-flex items-center gap-3 bg-gray-800/50 text-white px-8 py-4 rounded-2xl font-bold border border-white/10 transition-all hover:bg-gray-800 active:scale-95 shadow-xl">
            Return to qlynk <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FullPageChat 
      username={username}
      agentConfig={agentConfig}
      profile={pageData}
    />
  );
}
