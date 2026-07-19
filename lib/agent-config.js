import { DEFAULT_AGENT_TYPE, isSupportedAgentType } from './agent-type-catalog.js';

export const AGENT_CONFIG_EDITABLE_FIELDS = Object.freeze([
  'agent_name',
  'agent_avatar',
  'welcome_message',
  'bio',
  'skills',
  'projects',
  'contact_info',
  'social_links',
  'custom_knowledge',
  'primary_color',
  'position',
  'is_enabled',
  'is_published',
  'tone',
  'access_level',
  'chat_bg_color',
  'user_bubble_color',
  'ai_bubble_color',
  'cta_button_color',
  'cta_text_color',
  'pre_chat_text_color',
  'gatekeeper_text_color',
  'font_family',
  'profession',
  'agent_type',
]);

export const AGENT_CONFIG_SNAPSHOT_SELECT = AGENT_CONFIG_EDITABLE_FIELDS.join(', ');

export function sanitizeEditableAgentConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const config = {};
  for (const field of AGENT_CONFIG_EDITABLE_FIELDS) {
    if (Object.hasOwn(value, field)) config[field] = value[field];
  }

  config.agent_type = isSupportedAgentType(config.agent_type)
    ? config.agent_type
    : DEFAULT_AGENT_TYPE;

  // Password material is intentionally never accepted by draft or snapshot flows.
  delete config.access_password;
  delete config.access_password_hash;
  return config;
}
