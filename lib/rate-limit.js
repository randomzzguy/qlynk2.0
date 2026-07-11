import { createHash } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/server';
import { getRateLimitIdentifier } from '@/lib/client-ip';

const fallbackStore = new Map();

function hashIdentifier(identifier) {
  return createHash('sha256').update(identifier).digest('hex');
}

function checkFallback(identifier, namespace, maxRequests, windowMs) {
  const key = `${hashIdentifier(identifier)}:${namespace}`;
  const now = Date.now();
  let entry = fallbackStore.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    fallbackStore.set(key, entry);
  } else {
    entry.count += 1;
  }
  return {
    allowed: entry.count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(maxRequests - entry.count, 0),
    resetAt: entry.resetAt,
  };
}

export async function checkRateLimit(req, namespace, maxRequests, windowMs) {
  const identifier = getRateLimitIdentifier(req);
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('check_api_rate_limit', {
      p_namespace: namespace,
      p_key_hash: hashIdentifier(identifier),
      p_max_requests: maxRequests,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error) throw error;
    const result = data?.[0];
    if (!result) throw new Error('Rate-limit function returned no result');
    return {
      allowed: result.allowed,
      limit: maxRequests,
      remaining: result.remaining,
      resetAt: new Date(result.reset_at).getTime(),
    };
  } catch (error) {
    // Availability is preferred during a Supabase outage, but the per-instance
    // limiter still provides a local backstop and a clear operational warning.
    console.error('[Rate Limit] Shared limiter unavailable; using local fallback:', error.message);
    return checkFallback(identifier, namespace, maxRequests, windowMs);
  }
}

export async function rateLimitResponse(req, namespace, maxRequests, windowMs) {
  const result = await checkRateLimit(req, namespace, maxRequests, windowMs);
  if (result.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(result.resetAt),
      'Retry-After': String(retryAfter),
    },
  });
}
