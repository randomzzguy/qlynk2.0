import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getUsernameChangeAvailability,
  normalizeUsername,
  validateUsername,
} from '../lib/usernames.js';

test('usernames are normalized and validated consistently', () => {
  assert.equal(normalizeUsername('  New-Handle_2  '), 'new-handle_2');
  assert.deepEqual(validateUsername('New-Handle_2'), { username: 'new-handle_2', error: null });
  assert.match(validateUsername('two words').error, /3-30 characters/);
  assert.match(validateUsername('dashboard').error, /reserved/);
  assert.match(validateUsername('todos').error, /reserved/);
});

test('an account can rename immediately, then again exactly 30 days later', () => {
  const changedAt = '2026-08-02T00:00:00.000Z';
  assert.deepEqual(getUsernameChangeAvailability(null, Date.parse(changedAt)), {
    canChange: true,
    nextChangeAt: null,
  });
  assert.deepEqual(getUsernameChangeAvailability(changedAt, Date.parse('2026-08-31T23:59:59.999Z')), {
    canChange: false,
    nextChangeAt: '2026-09-01T00:00:00.000Z',
  });
  assert.equal(
    getUsernameChangeAvailability(changedAt, Date.parse('2026-09-01T00:00:00.000Z')).canChange,
    true,
  );
});
