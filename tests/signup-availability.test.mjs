import test from 'node:test';
import assert from 'node:assert/strict';

import {
  authEmailExists,
  isDuplicateSignupResult,
} from '../lib/signup-availability.js';

function mockAdmin(pages) {
  const calls = [];
  return {
    calls,
    auth: {
      admin: {
        async listUsers(params) {
          calls.push(params);
          return pages[params.page - 1];
        },
      },
    },
  };
}

test('email availability checks every Auth page and compares normalized addresses', async () => {
  const admin = mockAdmin([
    {
      data: {
        users: [{ email: 'first@example.com' }],
        nextPage: 2,
      },
      error: null,
    },
    {
      data: {
        users: [{ email: 'Existing@Example.com' }],
        nextPage: null,
      },
      error: null,
    },
  ]);

  assert.deepEqual(await authEmailExists(admin, ' existing@example.com '), {
    exists: true,
    error: null,
  });
  assert.equal(admin.calls.length, 2);
  assert.equal(admin.calls[0].perPage, 1_000);
});

test('email availability fails closed when the Auth admin lookup fails', async () => {
  const lookupError = new Error('Auth unavailable');
  const admin = mockAdmin([{ data: { users: [] }, error: lookupError }]);

  assert.deepEqual(await authEmailExists(admin, 'new@example.com'), {
    exists: false,
    error: lookupError,
  });
});

test('masked and explicit duplicate signup responses are recognized', () => {
  assert.equal(isDuplicateSignupResult({ user: { identities: [] } }, null), true);
  assert.equal(isDuplicateSignupResult(null, { code: 'user_already_exists' }), true);
  assert.equal(isDuplicateSignupResult(null, { message: 'User already registered' }), true);
  assert.equal(isDuplicateSignupResult({ user: { identities: [{ provider: 'email' }] } }, null), false);
});
