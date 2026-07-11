import net from 'node:net';

function normalizeIp(value) {
  const candidate = String(value || '').split(',')[0].trim();
  return net.isIP(candidate) ? candidate : null;
}

export function getRateLimitIdentifier(req) {
  const vercelIp = normalizeIp(req.headers.get?.('x-vercel-forwarded-for'));
  if (vercelIp) return `ip:${vercelIp}`;

  const forwardedIp = normalizeIp(req.headers.get?.('x-forwarded-for'));
  if (forwardedIp) return `ip:${forwardedIp}`;

  const realIp = normalizeIp(req.headers.get?.('x-real-ip'));
  if (realIp) return `ip:${realIp}`;

  return `unknown:${String(req.headers.get?.('user-agent') || 'unidentified').slice(0, 500)}`;
}
