import { createClient } from '@/utils/supabase/server';
import { THEMES } from '@/lib/themeRegistry';
import Link from 'next/link';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import ChatWidget from '@/components/ChatWidget';
import { isAgentLive } from '@/lib/subscriptionHelpers';

// This tells Next.js to generate pages dynamically
export const dynamic = 'force-dynamic';

export default async function PublicPage({ params }) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch page data from Supabase by joining with profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Techy background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#f46530]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
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

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*, social_links(*), custom_links(*)')
    .eq('user_id', profile.id)
    .single();

  if (pageError || !page) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-8 border border-gray-700/50">
          <Lock className="text-gray-500" size={32} />
        </div>
        <h1 className="text-3xl font-black text-white mb-4">
          Page Under Construction
        </h1>
        <p className="text-gray-400 mb-10 max-w-sm">
          @{username} is setting up their digital space. Check back very soon!
        </p>
        <Link href="/" className="text-[#f46530] font-bold hover:underline flex items-center gap-2 transition-all hover:gap-3">
          Create your own Qlynk
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // Get the theme configuration
  const themeConfig = THEMES[page.theme];

  // Fallback to quickpitch if theme not found
  if (!themeConfig) {
    console.warn(`Theme "${page.theme}" not found, falling back to quickpitch`);
    const QuickPitch = THEMES.quickpitch.component;
    return <QuickPitch data={{
      config_version: 'v1',
      headline: page.name || 'Welcome',
      subhead: page.tagline || page.profession || '',
      email: page.email || ''
    }} />;
  }

  // Get the theme component
  const ThemeComponent = themeConfig.component;

  // Merge theme_data with basic page fields
  // Theme components expect data from theme_data JSONB field
  const componentData = {
    ...page.theme_data, // Theme-specific data from JSONB
    // Add common fields that might be used across themes
    name: page.name,
    profession: page.profession,
    tagline: page.tagline,
    bio: page.bio,
    profileImage: page.profile_image,
    email: page.email,
    phone: page.phone,
    socialLinks: page.social_links || [],
    customLinks: page.custom_links || []
  };

  // Fetch agent config for chat widget
  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_enabled', true)
    .single();

  // Check if agent is live (trial active or paid subscription)
  const agentIsLive = await isAgentLive(profile.id);

  // If agent is not live, show unavailable message
  if (!agentIsLive) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Animated grid/techy background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #f46530 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#f46530]/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="w-24 h-24 bg-gray-800/40 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#f46530]/30 shadow-[0_0_50px_rgba(244,101,48,0.15)]">
            <Lock className="text-[#f46530]" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
            Q-Agent Offline
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            This Q-Agent is currently in maintenance or awaiting subscription activation.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold border border-white/10 transition-all hover:border-white/20 active:scale-95"
          >
            Return to Qlynk
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeComponent data={componentData} />
      {agentConfig && (
        <ChatWidget 
          username={username}
          agentName={agentConfig.agent_name}
          agentAvatar={agentConfig.agent_avatar}
          welcomeMessage={agentConfig.welcome_message}
          primaryColor={agentConfig.primary_color}
          position={agentConfig.position}
        />
      )}
    </>
  );
}
