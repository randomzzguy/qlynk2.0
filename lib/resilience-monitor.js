import { getGroqBudget } from './groq-quota.js';

function positiveLimit(value, fallback) {
  const number = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error('Invalid monitoring limit');
  return number;
}
function measuredNumber(value) {
  if (value === null || value === undefined || value === '') throw new Error('Missing monitoring measurement');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid monitoring measurement');
  return number;
}

export function assessResilience(snapshot, env = process.env, now = Date.now()) {
  if (!snapshot || !Array.isArray(snapshot.budgets) || !snapshot.storage
    || !Number.isFinite(Date.parse(snapshot.observed_at)) || Math.abs(now - Date.parse(snapshot.observed_at)) > 5 * 60_000) {
    throw new Error('Missing or stale resilience snapshot');
  }
  const checks = [];
  const capacity = (name, value, limit) => {
    const used = measuredNumber(value);
    const percent = Math.round(used / limit * 1000) / 10;
    checks.push({ name, used, limit, percent, status: percent >= 95 ? 'critical' : percent >= 80 ? 'warning' : 'ok' });
  };
  capacity('database_bytes', snapshot.database_bytes, positiveLimit(env.MONITOR_DATABASE_LIMIT_BYTES, 500_000_000));
  capacity('storage_known_bytes', snapshot.storage.known_bytes, positiveLimit(env.MONITOR_STORAGE_LIMIT_BYTES, 1_000_000_000));
  const unknownObjects = measuredNumber(snapshot.storage.unknown_objects);
  if (unknownObjects) checks.push({ name: 'storage_size_coverage', status: 'warning', unknownObjects });
  const expired = measuredNumber(snapshot.expired_chat_reservations);
  checks.push({ name: 'expired_chat_reservations', count: expired, status: expired ? 'warning' : 'ok' });
  for (const bucket of snapshot.budgets) {
    const prefix = `${bucket.scope}/${bucket.model}`;
    let limits;
    try { limits = getGroqBudget(bucket.model, env); }
    catch { checks.push({ name: `${prefix}/configuration`, status: 'warning' }); continue; }
    for (const [field, key] of [['requests_minute','rpm'], ['requests_day','rpd'], ['tokens_minute','tpm'], ['tokens_day','tpd'], ['active_requests','concurrency']]) {
      capacity(`${prefix}/${field}`, bucket[field], limits[key]);
    }
    const blockedUntil = Date.parse(bucket.blocked_until);
    if (!Number.isFinite(blockedUntil)) throw new Error('Invalid provider cooldown measurement');
    if (blockedUntil > now) checks.push({ name: `${prefix}/cooldown`, status: 'warning', retryAfter: Math.ceil((blockedUntil-now)/1000) });
  }
  return {
    status: checks.some(c => c.status === 'critical') ? 'critical' : checks.some(c => c.status === 'warning') ? 'warning' : 'ok',
    observedAt: snapshot.observed_at, checks,
    limitations: [
      'Database bytes do not measure total disk/WAL usage.',
      'Storage bytes come from object metadata; missing metadata is reported separately.',
      'AI values are application estimates, not live provider account quotas.',
      'Hosting, egress, backup files and restore readiness require separate checks.',
    ],
  };
}
