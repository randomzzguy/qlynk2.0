import { DEFAULT_AGENT_TYPE } from '@/lib/agent-type-catalog';

export const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Outfit',
  'Poppins',
  'Sora',
  'DM Sans',
  'Space Grotesk',
  'Plus Jakarta Sans',
  'Nunito',
  'Raleway',
  'Lato',
  'Montserrat',
  'Open Sans',
  'Source Code Pro',
  'Fira Code',
];

export function createInitialAgentConfig() {
  return {
    agent_name: 'Your AI',
    agent_avatar: '',
    welcome_message: 'Hi! I\'m the AI assistant for this page. How can I help you?',
    bio: '',
    skills: [],
    projects: [],
    contact_info: {
      email: '',
      phone: '',
      location: '',
      website: '',
      calendly: ''
    },
    social_links: [],
    custom_knowledge: '',
    primary_color: '#f46530',
    position: 'bottom-right',
    is_enabled: true,
    tone: 'professional',
    agent_type: DEFAULT_AGENT_TYPE,
    access_level: 'public',
    // Visual customization
    chat_bg_color: '#0a0a0f',
    user_bubble_color: '#ffffff1a',
    ai_bubble_color: '#3b82f620',
    cta_button_color: '#f46530',
    cta_text_color: '#ffffff',
    pre_chat_text_color: '#9ca3af',
    gatekeeper_text_color: '#9ca3af',
    font_family: 'Inter',
    profession: 'Digital Creator',
  };
}
