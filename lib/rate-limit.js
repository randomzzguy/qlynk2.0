/**
 * Simple in-memory sliding-window rate limiter for Next.js API routes.
 * No external dependencies (no Redis required).
 *
 * NOTE: In a multi-instance deployment (Vercel, multi-container),
 * each instance has its own memory store, so a determined actor
 * could theoretically bypass limits by hitting different instances.
 * For launch this is sufficient; upgrade to Redis when scaling past
 * a single server or if abuse becomes a problem.
 */

const store = new Map();

// Clean up expired entries every 10 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

function getClientIp(req) {
  // Try common proxy headers first, fall back to socket remote address
  const forwarded = req.headers.get?.('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get?.('x-real-ip');
  if (realIp) return realIp;
  // Socket IP is only available in Node runtime (not Edge)
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check if a request should be rate-limited.
 * @param {Request} req - The incoming request object
 * @param {string} namespace - Unique namespace for the endpoint (e.g. 'ai-chat')
 * @param {number} maxRequests - Max requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, limit: number, remaining: number, resetAt: number }}
 */
export function checkRateLimit(req, namespace, maxRequests, windowMs) {
  const ip = getClientIp(req);
  const key = `${ip}:${namespace}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, limit: maxRequests, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, limit: maxRequests, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, limit: maxRequests, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Convenience wrapper that returns a NextResponse for blocked requests.
 * @param {Request} req
 * @param {string} namespace
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {NextResponse|null} - Returns a response if blocked, null if allowed
 */
export function rateLimitResponse(req, namespace, maxRequests, windowMs) {
  const result = checkRateLimit(req, namespace, maxRequests, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  return null;
}
