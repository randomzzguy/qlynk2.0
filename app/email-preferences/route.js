import { createClient } from '@supabase/supabase-js';
import {
  getEmailPreferenceUpdate,
  verifyEmailPreferencesToken,
} from '@/lib/email/preferences';

export const dynamic = 'force-dynamic';

const CATEGORY_COPY = {
  new_message: {
    title: 'Turn off new conversation emails?',
    description: 'You will no longer receive an email when someone starts a new conversation with your Qlynk agent.',
  },
  trial_expiry: {
    title: 'Turn off trial reminder emails?',
    description: 'You will no longer receive trial expiry warnings or trial-ended emails.',
  },
  subscription: {
    title: 'Turn off subscription emails?',
    description: 'You will no longer receive Qlynk renewal or billing notification emails.',
  },
  all: {
    title: 'Turn off all optional emails?',
    description: 'You will no longer receive conversation, trial, renewal, or billing notification emails from Qlynk.',
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pageHtml({ title, description, form = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Qlynk</title>
</head>
<body style="margin:0;background:#09090b;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;">
    <section style="width:100%;max-width:520px;background:#111113;border:1px solid #29292d;border-radius:18px;padding:36px;box-sizing:border-box;box-shadow:0 20px 60px rgba(0,0,0,.35);">
      <div style="font-size:26px;font-weight:800;margin-bottom:30px;">qlynk<span style="color:#f46530;">.</span></div>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.65;color:#a1a1aa;margin:0 0 28px;">${escapeHtml(description)}</p>
      ${form}
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:26px 0 0;">You can update these choices again anytime from Dashboard Settings.</p>
    </section>
  </main>
</body>
</html>`;
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function invalidLinkResponse() {
  return htmlResponse(pageHtml({
    title: 'This link is not valid',
    description: 'The email preferences link may be incomplete or altered. Open the original email again, or update notifications from Dashboard Settings.',
  }), 400);
}

function readToken(searchParams) {
  return {
    userId: searchParams.get('uid') || '',
    category: searchParams.get('category') || '',
    signature: searchParams.get('signature') || '',
  };
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request) {
  const token = readToken(new URL(request.url).searchParams);
  if (!verifyEmailPreferencesToken(token.userId, token.category, token.signature)) {
    return invalidLinkResponse();
  }

  const copy = CATEGORY_COPY[token.category];
  const form = `<form method="post" action="/email-preferences">
    <input type="hidden" name="uid" value="${escapeHtml(token.userId)}" />
    <input type="hidden" name="category" value="${escapeHtml(token.category)}" />
    <input type="hidden" name="signature" value="${escapeHtml(token.signature)}" />
    <button type="submit" style="width:100%;border:0;border-radius:10px;background:#f46530;color:#fff;padding:14px 20px;font-size:15px;font-weight:700;cursor:pointer;">Confirm email preference</button>
  </form>`;

  return htmlResponse(pageHtml({ ...copy, form }));
}

export async function POST(request) {
  const formData = await request.formData();
  const token = {
    userId: String(formData.get('uid') || ''),
    category: String(formData.get('category') || ''),
    signature: String(formData.get('signature') || ''),
  };

  if (!verifyEmailPreferencesToken(token.userId, token.category, token.signature)) {
    return invalidLinkResponse();
  }

  const supabase = getAdminClient();
  if (!supabase) {
    console.error('[Email Preferences] Missing Supabase environment variables');
    return htmlResponse(pageHtml({
      title: 'We could not save that change',
      description: 'Please try again in a few minutes. No settings were changed.',
    }), 500);
  }

  const update = getEmailPreferenceUpdate(token.category);
  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', token.userId)
    .select('id');

  if (error) {
    console.error('[Email Preferences] Update failed:', error.message);
    return htmlResponse(pageHtml({
      title: 'We could not save that change',
      description: 'Please try again in a few minutes. No settings were changed.',
    }), 500);
  }

  const description = data?.length
    ? 'Your email preferences have been updated. You do not need to log in or take any further action.'
    : 'There is no active account connected to this link, so there are no email preferences left to update.';

  return htmlResponse(pageHtml({
    title: 'Your preferences are saved',
    description,
  }));
}
