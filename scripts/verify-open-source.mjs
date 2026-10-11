import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const textFile = path => /\.(?:js|jsx|ts|tsx|mjs|cjs|json|md|txt|sql|toml|ya?ml|html|ps1|sh|env|example)$/.test(path) || /(^|\/)(?:LICENSE|\.env[^/]*)$/.test(path);
const findings = [];
function inspect(label, content) {
  const patterns = [
    ['provider credential', /\b(?:sk_(?:live|test)_|rk_live_|gsk_|whsec_|sb_secret_|ghp_|github_pat_)[A-Za-z0-9_-]{24,}\b/g],
    ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ['Resend credential', /\bre_[A-Za-z0-9]{24,}\b/g],
  ];
  for (const [kind, pattern] of patterns) {
    if ([...content.matchAll(pattern)].some(match => !/placeholder|example|fixture|your-|intentionally/i.test(match[0]))) findings.push({ label, kind });
  }
  for (const match of content.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)) {
    try {
      const claims = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
      if (claims.role === 'service_role') findings.push({ label, kind: 'Supabase service-role JWT' });
    } catch { /* A non-JWT string is not evidence of a service key. */ }
  }
}

const tracked = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
for (const path of tracked.filter(textFile)) {
  try { inspect(path, readFileSync(path, 'utf8')); } catch { /* Deleted tracked file. */ }
}
let historyCount = 0;
if (process.argv.includes('--history')) {
  const seen = new Set();
  for (const line of git('rev-list', '--objects', '--all').trim().split('\n')) {
    const separator = line.indexOf(' ');
    if (separator === -1) continue;
    const oid = line.slice(0, separator);
    const path = line.slice(separator + 1);
    if (!textFile(path) || seen.has(oid)) continue;
    seen.add(oid);
    if (git('cat-file', '-t', oid).trim() !== 'blob') continue;
    const bytes = Number(git('cat-file', '-s', oid).trim());
    if (bytes > 2_000_000) continue;
    inspect(`history ${oid.slice(0, 12)} ${path}`, git('cat-file', 'blob', oid));
    historyCount++;
  }
}
for (const required of ['LICENSE', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', '.env.example']) {
  try { if (!readFileSync(required, 'utf8').trim()) throw new Error(); }
  catch { findings.push({ label: required, kind: 'missing publication file' }); }
}
if (findings.length) {
  console.error('Open-source readiness failed. Findings show locations only, never secret values:');
  for (const { label, kind } of findings) console.error(`- ${kind}: ${label}`);
  process.exitCode = 1;
} else {
  console.log(`Publication files present; credential-pattern scan passed for tracked and new non-ignored files${historyCount ? ` and ${historyCount} historical text blobs` : ''}. This pattern scan is not a comprehensive security audit.`);
}
