import { createClient } from '@supabase/supabase-js';
import { deleteAccountData, getDueScheduledAccountDeletions } from '@/lib/accountDeletion';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isValidBearer = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isValidBearer) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dueDeletions = await getDueScheduledAccountDeletions({
      supabaseAdmin,
      beforeIso: new Date().toISOString(),
    });

    let deleted = 0;
    const errors = [];

    for (const account of dueDeletions) {
      try {
        await deleteAccountData({
          supabaseAdmin,
          stripe,
          userId: account.id,
        });
        deleted++;
      } catch (error) {
        console.error(`[Account Deletions Cron] Failed for ${account.id}:`, error);
        errors.push({
          user_id: account.id,
          username: account.username || null,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      scanned: dueDeletions.length,
      deleted,
      errors,
    });
  } catch (error) {
    console.error('[Account Deletions Cron] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
