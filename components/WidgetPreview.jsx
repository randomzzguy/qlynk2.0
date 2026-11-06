'use client';

import ChatWidget from '@/components/ChatWidget';

export default function WidgetPreview({ form = {}, agent = {}, mobile = false, screen, tier }) {
  const needsForm = form.pre_chat_enabled || (agent?.access_level && agent.access_level !== 'public');
  const previewScreen = screen || (needsForm ? 'pre-chat' : 'chat');
  return (
    <div className={`relative mx-auto h-[620px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#f7f7f8] ${mobile ? 'max-w-[320px]' : 'max-w-[680px]'}`}>
      <div className="flex h-12 items-center gap-2 border-b border-black/5 bg-white px-4" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 h-6 flex-1 rounded-lg bg-gray-100" />
      </div>
      <div className="space-y-3 p-6" aria-hidden="true">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200/70" />
        <div className="h-3 w-4/5 rounded bg-gray-200/70" />
      </div>
      <div className={`absolute bottom-4 top-16 w-[calc(100%-32px)] max-w-[360px] ${form.position === 'bottom-left' ? 'left-4' : 'right-4'}`}>
        <ChatWidget
          key={previewScreen}
          preview
          previewScreen={previewScreen}
          agentName={agent?.agent_name || 'Your AI'}
          agentAvatar={agent?.agent_avatar}
          welcomeMessage={agent?.welcome_message}
          primaryColor={agent?.primary_color}
          launcherColor={form.launcher_color}
          agentType={agent?.agent_type}
          accessLevel={agent?.access_level}
          chatBgColor={agent?.chat_bg_color}
          userBubbleColor={agent?.user_bubble_color}
          aiBubbleColor={agent?.ai_bubble_color}
          ctaButtonColor={agent?.cta_button_color}
          ctaTextColor={agent?.cta_text_color}
          headingTextColor={agent?.heading_text_color}
          gatekeeperTextColor={agent?.gatekeeper_text_color}
          fontFamily={agent?.font_family}
          preChatEnabled={form.pre_chat_enabled}
          preChatEmailEnabled={form.pre_chat_email_enabled}
          preChatEmailRequired={form.pre_chat_email_required}
          preChatIntro={form.pre_chat_intro}
          preChatStyle={form.pre_chat_style}
          tier={tier}
        />
      </div>
    </div>
  );
}
