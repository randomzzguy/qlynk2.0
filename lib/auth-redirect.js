export function safeAuthRedirect(value, fallback = '/auth/confirm-success') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}
