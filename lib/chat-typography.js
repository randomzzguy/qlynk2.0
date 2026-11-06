// Keep saved copy intact while repairing invisible spacing in pasted contractions.
export function normalizeWelcomeMessage(value) {
  return String(value || '').replace(
    /(\p{L})['’ʼ＇][\s\u200b\u2060\ufeff]+(m|s|t|re|ve|ll|d)\b/giu,
    "$1’$2",
  );
}

export function chatFontFamily(font = 'Inter') {
  const safeFont = String(font || 'Inter').replace(/[^a-zA-Z0-9 -]/g, '');
  return `"${safeFont || 'Inter'}", Arial, sans-serif`;
}

export function chatTint(color, opacity) {
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}
