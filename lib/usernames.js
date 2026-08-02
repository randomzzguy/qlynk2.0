export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

export const RESERVED_USERNAMES = new Set([
  'about', 'account', 'admin', 'agent-rules-preview', 'ai-agent', 'ai-clone',
  'api', 'auth', 'blog', 'compare', 'create', 'dashboard', 'digital-twin',
  'docs', 'email-preferences', 'embed', 'faq', 'features', 'for-business',
  'for-creators', 'for-founders', 'for-freelancers', 'for-job-seekers',
  'help', 'login', 'onboarding', 'personal-ai', 'premium-themes', 'press',
  'preview', 'pricing', 'privacy', 'settings', 'signup', 'solutions',
  'support', 'terms', 'todos', 'www',
]);

export function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validateUsername(value) {
  const username = normalizeUsername(value);

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return {
      username,
      error: 'Username must be 3-30 characters and use only lowercase letters, numbers, hyphens, or underscores.',
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return { username, error: 'This username is reserved. Please choose another one.' };
  }

  return { username, error: null };
}

export function getNextUsernameChangeAt(changedAt) {
  if (!changedAt) return null;
  const timestamp = new Date(changedAt).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp + USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function getUsernameChangeAvailability(changedAt, now = Date.now()) {
  const nextChangeAt = getNextUsernameChangeAt(changedAt);
  return {
    canChange: !nextChangeAt || new Date(nextChangeAt).getTime() <= now,
    nextChangeAt,
  };
}
