/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const lockPath = path.resolve(process.cwd(), '.next', 'dev', 'lock');
try {
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('Removed stale Next dev lock:', lockPath);
  } else {
    // No lock present
  }
} catch (err) {
  // Non-fatal: log and continue
  console.warn('Could not remove .next dev lock (non-fatal):', err?.message || err);
}
