export const DEFAULT_WIDGET_THEME = Object.freeze({
  accentColor: '#f46530',
  chatBgColor: '#0a0a0f',
  userBubbleColor: '#ffffff1a',
  aiBubbleColor: '#3b82f620',
  ctaButtonColor: '#f46530',
  ctaTextColor: '#ffffff',
  gatekeeperTextColor: '#9ca3af',
  fontFamily: 'Inter',
});

export const WIDGET_SURFACE_SHADOW = '0 28px 80px rgba(0, 0, 0, 0.34), 0 10px 30px rgba(0, 0, 0, 0.18)';

function configuredValue(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function resolveWidgetTheme({ widget = {}, agent = {} } = {}) {
  const accentColor = configuredValue(
    widget.launcher_color,
    configuredValue(agent.primary_color, DEFAULT_WIDGET_THEME.accentColor),
  );

  return {
    accentColor,
    chatBgColor: configuredValue(agent.chat_bg_color, DEFAULT_WIDGET_THEME.chatBgColor),
    userBubbleColor: configuredValue(agent.user_bubble_color, DEFAULT_WIDGET_THEME.userBubbleColor),
    aiBubbleColor: configuredValue(agent.ai_bubble_color, DEFAULT_WIDGET_THEME.aiBubbleColor),
    ctaButtonColor: configuredValue(agent.cta_button_color, accentColor),
    ctaTextColor: configuredValue(agent.cta_text_color, DEFAULT_WIDGET_THEME.ctaTextColor),
    gatekeeperTextColor: configuredValue(agent.gatekeeper_text_color, DEFAULT_WIDGET_THEME.gatekeeperTextColor),
    fontFamily: configuredValue(agent.font_family, DEFAULT_WIDGET_THEME.fontFamily),
  };
}
