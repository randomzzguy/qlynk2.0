export function configuredBackupProject(env = process.env) {
  let fromUrl;
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    fromUrl = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname)?.[1];
  }
  const explicit = env.SUPABASE_PROJECT_REF;
  if (explicit && !/^[a-z0-9]{20}$/.test(explicit)) throw new Error('Invalid Supabase project reference');
  if (explicit && fromUrl && explicit !== fromUrl) throw new Error('Backup project does not match the configured Supabase URL');
  const project = explicit || fromUrl;
  if (!project) throw new Error('Configure SUPABASE_PROJECT_REF or a hosted NEXT_PUBLIC_SUPABASE_URL; no default production project is assumed');
  return project;
}

export function assessBackupReadiness(payload, { now = Date.now(), maxAgeHours = 48 } = {}) {
  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) throw new Error('Invalid backup freshness threshold');
  const times = [];
  for (const backup of Array.isArray(payload?.backups) ? payload.backups : []) {
    const time = Date.parse(backup.inserted_at);
    if (backup.status === 'COMPLETED' && Number.isFinite(time) && time <= now) times.push(time);
  }
  const earliest = payload?.physical_backup_data?.earliest_physical_backup_date_unix;
  const latest = payload?.physical_backup_data?.latest_physical_backup_date_unix;
  if (payload?.pitr_enabled === true && Number.isSafeInteger(earliest) && Number.isSafeInteger(latest)
    && earliest > 0 && latest >= earliest && latest * 1000 <= now) times.push(latest * 1000);
  const newest = times.length ? Math.max(...times) : null;
  const ageHours = newest === null ? null : (now-newest)/3_600_000;
  const available = newest !== null && ageHours <= maxAgeHours;
  return {
    status: available ? 'recovery_point_advertised' : 'not_ready',
    latestRecoveryPoint: newest === null ? null : new Date(newest).toISOString(),
    ageHours, maxAgeHours,
    reason: newest === null ? 'No completed backup or valid PITR recovery range was advertised.'
      : available ? 'A recent provider recovery point is advertised; restore access and restoration still require verification.'
      : 'The newest advertised recovery point exceeds the freshness threshold.',
    storageObjectsVerified: false, restoreDrillVerified: false,
  };
}
