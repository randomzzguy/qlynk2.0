const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const POSITIONS = new Set(['bottom-right', 'bottom-left']);

export function isWidgetId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function normalizeWidgetOrigin(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function normalizeAllowedOrigins(values) {
  if (!Array.isArray(values)) {
    return { error: 'Allowed websites must be a list.', origins: [] };
  }

  const origins = [];
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const origin = normalizeWidgetOrigin(value);
    if (!origin) {
      return { error: `“${String(value).slice(0, 80)}” is not a valid website origin.`, origins: [] };
    }
    if (!origins.includes(origin)) origins.push(origin);
  }

  if (origins.length > 10) {
    return { error: 'A widget can be installed on up to 10 website origins.', origins: [] };
  }
  return { origins };
}

export function isOriginAllowed(origin, allowedOrigins) {
  const normalizedOrigin = normalizeWidgetOrigin(origin);
  if (!normalizedOrigin) return false;
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(normalizedOrigin);
}

export function sanitizeWidgetInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Invalid widget configuration.' };
  }

  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '';
  if (!name) return { error: 'Give this widget a name.' };

  const allowed = normalizeAllowedOrigins(value.allowed_origins || []);
  if (allowed.error) return { error: allowed.error };

  const position = POSITIONS.has(value.position) ? value.position : 'bottom-right';
  const launcherColor = value.launcher_color == null || value.launcher_color === ''
    ? null
    : String(value.launcher_color).trim();
  if (launcherColor && !HEX_COLOR_PATTERN.test(launcherColor)) {
    return { error: 'Launcher color must be a six-digit hex color.' };
  }

  const preChatEnabled = value.pre_chat_enabled === true;
  const preChatEmailEnabled = value.pre_chat_email_enabled !== false;
  const preChatEmailRequired = preChatEmailEnabled && value.pre_chat_email_required === true;
  const preChatIntro = typeof value.pre_chat_intro === 'string'
    ? value.pre_chat_intro.trim().slice(0, 240)
    : 'Tell us who you are so we can better assist you.';
  if (!preChatIntro) return { error: 'Add a short introduction for the pre-chat form.' };

  return {
    value: {
      name,
      is_enabled: value.is_enabled !== false,
      allowed_origins: allowed.origins,
      position,
      launcher_color: launcherColor,
      pre_chat_enabled: preChatEnabled,
      pre_chat_email_enabled: preChatEmailEnabled,
      pre_chat_email_required: preChatEmailRequired,
      pre_chat_intro: preChatIntro,
    },
  };
}

export function buildWidgetEmbedCode(origin, widgetId) {
  const safeOrigin = String(origin || '').replace(/\/$/, '');
  if (!safeOrigin || !isWidgetId(widgetId)) return '';
  return `<script src="${safeOrigin}/qlynk-agent.js" data-widget-id="${widgetId}" async></script>`;
}
