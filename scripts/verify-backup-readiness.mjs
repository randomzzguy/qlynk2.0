import { configuredBackupProject, assessBackupReadiness } from '../lib/backup-readiness.js';

try {
  const project = configuredBackupProject();
  if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error('Set a server-only SUPABASE_ACCESS_TOKEN with backups_read permission. A database service-role key cannot inspect provider backups.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/backups`, {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (!response.ok) throw new Error(`Backup metadata unavailable (HTTP ${response.status}). Verify project access and token permissions.`);
  const report = assessBackupReadiness(await response.json(), { maxAgeHours: Number(process.env.BACKUP_MAX_AGE_HOURS || 48) });
  console.log(`Configured Supabase project: ${project}`);
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'recovery_point_advertised') process.exitCode = 1;
  console.log('This is not a complete backup-readiness pass: uploaded Storage files and an isolated restore drill must be verified separately. Free projects can use off-site exports.');
} catch (error) {
  console.error(`Backup readiness NOT VERIFIED: ${error.message}`);
  process.exitCode = 1;
}
