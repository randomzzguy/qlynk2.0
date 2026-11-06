export const PRE_CHAT_COLOR_FIELDS = Object.freeze([
  { key: 'backgroundColor', label: 'Form background', defaultValue: '#0a0a0f' },
  { key: 'headingColor', label: 'Form heading', defaultValue: '#ffffff' },
  { key: 'introColor', label: 'Introduction text', defaultValue: '#cbd5e1' },
  { key: 'labelColor', label: 'Field labels', defaultValue: '#e5e7eb' },
  { key: 'inputBackgroundColor', label: 'Input background', defaultValue: '#ffffff1a' },
  { key: 'inputTextColor', label: 'Input text', defaultValue: '#ffffff' },
  { key: 'placeholderColor', label: 'Input placeholder', defaultValue: '#9ca3af' },
  { key: 'inputBorderColor', label: 'Input border', defaultValue: '#ffffff26' },
  { key: 'focusColor', label: 'Input focus ring', defaultValue: '#f46530' },
  { key: 'supportingTextColor', label: 'Privacy notice text', defaultValue: '#9ca3af' },
  { key: 'buttonColor', label: 'Start button background', defaultValue: '#f46530' },
  { key: 'buttonTextColor', label: 'Start button text', defaultValue: '#ffffff' },
]);

const HEX_COLOR = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;

export function sanitizePreChatStyle(value) {
  if (value == null) return { value: {} };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Pre-chat colors must be an object.' };
  }
  const style = {};
  for (const { key, label } of PRE_CHAT_COLOR_FIELDS) {
    const color = value[key];
    if (color == null || color === '') continue;
    if (typeof color !== 'string' || !HEX_COLOR.test(color.trim())) {
      return { error: `${label} must be a six- or eight-digit hex color.` };
    }
    style[key] = color.trim();
  }
  return { value: style };
}

export function resolvePreChatStyle(value, theme = {}) {
  const style = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  // Preserve existing surfaces and buttons until an override is selected.
  // Form text has readable defaults independent of public-page text colors.
  const inherited = {
    backgroundColor: theme.chatBgColor,
    focusColor: theme.accentColor,
    buttonColor: theme.ctaButtonColor,
    buttonTextColor: theme.ctaTextColor,
  };
  return Object.fromEntries(PRE_CHAT_COLOR_FIELDS.map(({ key, defaultValue }) => {
    const color = typeof style[key] === 'string' ? style[key].trim() : '';
    return [key, HEX_COLOR.test(color) ? color : inherited[key] || defaultValue];
  }));
}
