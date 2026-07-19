import { execFileSync } from 'node:child_process';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'erxtptqduhmkjswuzzpl';

let output;
try {
  output = execFileSync(
    'npx',
    ['supabase', 'backups', 'list', '--project-ref', projectRef, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' },
  );
} catch {
  console.error('Unable to read Supabase backup status. Confirm CLI login and project access.');
  process.exit(1);
}

const status = JSON.parse(output);
const backups = Array.isArray(status.backups) ? status.backups : [];
const recoverable = Boolean(status.pitr_enabled) || backups.length > 0;

console.log(`Supabase project: ${projectRef}`);
console.log(`Region: ${status.region || 'unknown'}`);
console.log(`PITR enabled: ${Boolean(status.pitr_enabled)}`);
console.log(`Available physical backups: ${backups.length}`);

if (!recoverable) {
  console.error('BACKUP READINESS FAIL: Supabase reports no available physical backup and PITR is disabled.');
  process.exit(1);
}

console.log('BACKUP READINESS PASS: a provider-managed recovery point is available.');
