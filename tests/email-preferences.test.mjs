import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEmailPreferencesUrl,
  getEmailPreferenceUpdate,
  verifyEmailPreferencesToken,
} from '../lib/email/preferences.js';
import { newMessageEmail } from '../lib/email/templates/new-message.js';
import { welcomeEmail } from '../lib/email/templates/welcome.js';

const USER_ID = '720c2cf1-9b72-4b96-a727-f2dbfa221aa7';

test.before(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'email-preference-test-secret';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://qlynk.site/';
});

test('builds a signed preference URL that verifies without a login session', () => {
  const url = new URL(buildEmailPreferencesUrl(USER_ID, 'trial_expiry'));

  assert.equal(url.origin, 'https://qlynk.site');
  assert.equal(url.pathname, '/email-preferences');
  assert.equal(url.searchParams.get('uid'), USER_ID);
  assert.equal(url.searchParams.get('category'), 'trial_expiry');
  assert.equal(
    verifyEmailPreferencesToken(
      USER_ID,
      'trial_expiry',
      url.searchParams.get('signature'),
    ),
    true,
  );
});

test('rejects altered or malformed preference links', () => {
  const url = new URL(buildEmailPreferencesUrl(USER_ID, 'new_message'));
  const signature = url.searchParams.get('signature');
  const alteredSignature = `${signature.slice(0, -1)}${signature.endsWith('0') ? '1' : '0'}`;

  assert.equal(verifyEmailPreferencesToken(USER_ID, 'subscription', signature), false);
  assert.equal(verifyEmailPreferencesToken('not-a-uuid', 'new_message', signature), false);
  assert.equal(verifyEmailPreferencesToken(USER_ID, 'new_message', alteredSignature), false);
});

test('maps each signed category only to its intended profile settings', () => {
  assert.deepEqual(getEmailPreferenceUpdate('new_message'), { notif_new_message: false });
  assert.deepEqual(getEmailPreferenceUpdate('trial_expiry'), { notif_trial_expiry: false });
  assert.deepEqual(getEmailPreferenceUpdate('subscription'), { notif_subscription: false });
  assert.deepEqual(getEmailPreferenceUpdate('all'), {
    notif_new_message: false,
    notif_trial_expiry: false,
    notif_subscription: false,
  });
  assert.equal(getEmailPreferenceUpdate('unknown'), null);
});

test('email templates use the signed link and never fall back to a login-only preference link', () => {
  const preferencesUrl = buildEmailPreferencesUrl(USER_ID, 'all');
  const withLink = welcomeEmail({ username: 'Mara', preferencesUrl }).html;
  const withoutLink = newMessageEmail({ messagePreview: 'Hello' }).html;

  assert.match(withLink, /Manage email preferences/);
  assert.ok(withLink.includes(preferencesUrl.replaceAll('&', '&amp;')) || withLink.includes(preferencesUrl));
  assert.doesNotMatch(withLink, /dashboard\/settings[^<]*Manage email preferences/);
  assert.doesNotMatch(withoutLink, /Manage email preferences/);
});
