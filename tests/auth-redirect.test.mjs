import test from 'node:test';
import assert from 'node:assert/strict';
import { safeAuthRedirect } from '../lib/auth-redirect.js';

test('auth callback accepts only local absolute paths', () => {
  assert.equal(safeAuthRedirect('/auth/update-password'), '/auth/update-password');
  assert.equal(safeAuthRedirect('/dashboard?welcome=1'), '/dashboard?welcome=1');
  assert.equal(safeAuthRedirect('https://evil.example'), '/auth/confirm-success');
  assert.equal(safeAuthRedirect('//evil.example'), '/auth/confirm-success');
  assert.equal(safeAuthRedirect(null), '/auth/confirm-success');
});
