const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'GROQ_API_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

async function expectOk(name, url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), ...options });
  if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);
  console.log(`${name}: HTTP ${response.status} PASS`);
  return response;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
await expectOk('Supabase Auth health', `${supabaseUrl}/auth/v1/health`, {
  headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
});

const groqResponse = await expectOk('Groq models API', 'https://api.groq.com/openai/v1/models', {
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
});
const groqModels = (await groqResponse.json()).data || [];
for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
  if (!groqModels.some((entry) => entry.id === model)) throw new Error(`Configured Groq model ${model} is unavailable`);
  console.log(`Groq model ${model}: available PASS`);
}

await expectOk('Stripe account API', 'https://api.stripe.com/v1/account', {
  headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
});

for (const name of [
  'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY',
  'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL',
  'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY',
  'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL',
]) {
  const priceId = process.env[name];
  const priceResponse = await expectOk(`Stripe price ${name}`, `https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const price = await priceResponse.json();
  if (!price.active || price.type !== 'recurring') throw new Error(`${name} is not an active recurring price`);
}

const captchaPayload = new URLSearchParams({
  secret: process.env.HCAPTCHA_SECRET_KEY,
  response: 'qlynk-launch-readiness-intentionally-invalid-token',
});
const captchaResponse = await expectOk('hCaptcha verification API', 'https://api.hcaptcha.com/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: captchaPayload,
});
const captchaResult = await captchaResponse.json();
if (captchaResult.success !== false || captchaResult['error-codes']?.includes('invalid-input-secret')) {
  throw new Error('hCaptcha secret validation returned an unexpected result');
}
console.log('hCaptcha secret accepted and intentionally invalid response rejected: PASS');

const resendResponse = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  signal: AbortSignal.timeout(10_000),
});
const fromMatch = String(process.env.EMAIL_FROM).match(/@([^>\s]+)>?$/);
if (!fromMatch) throw new Error('EMAIL_FROM does not contain a valid domain');
const senderDomain = fromMatch[1].toLowerCase();

if (resendResponse.ok) {
  const resendPayload = await resendResponse.json();
  const domains = resendPayload.data || resendPayload;
  const verified = Array.isArray(domains) && domains.some((domain) =>
    (senderDomain === domain.name || senderDomain.endsWith(`.${domain.name}`))
    && domain.status === 'verified'
  );
  if (!verified) throw new Error(`Resend sender domain ${senderDomain} is not verified`);
  console.log(`Resend sender domain ${senderDomain}: verified PASS`);
} else if (resendResponse.status === 401 && process.env.ALLOW_EMAIL_SMOKE_TEST === '1') {
  const smokeTestRecipient = String(process.env.EMAIL_SMOKE_TEST_TO || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smokeTestRecipient)) {
    throw new Error('EMAIL_SMOKE_TEST_TO must be set to a valid monitored inbox when ALLOW_EMAIL_SMOKE_TEST=1');
  }
  if (smokeTestRecipient === 'privacy@qlynk.site') {
    throw new Error('EMAIL_SMOKE_TEST_TO cannot use the unmonitored privacy@qlynk.site address');
  }
  const sendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'qlynk-launch-readiness-2026-07-11',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: smokeTestRecipient,
      subject: 'Qlynk launch readiness email verification',
      html: '<p>This idempotent message verifies Qlynk production transactional email configuration for the July 11, 2026 launch-readiness audit.</p>',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!sendResponse.ok) throw new Error(`Resend email smoke returned HTTP ${sendResponse.status}`);
  console.log(`Resend idempotent email accepted for the configured smoke-test inbox: HTTP ${sendResponse.status} PASS`);
} else {
  throw new Error(`Resend domain listing returned HTTP ${resendResponse.status}; use ALLOW_EMAIL_SMOKE_TEST=1 to verify a restricted send-only key`);
}

console.log('Production integration verification passed without exposing credentials.');
