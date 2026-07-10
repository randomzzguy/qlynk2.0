export function authorizeCronRequest(request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[Cron] CRON_SECRET is not configured.');
    return {
      ok: false,
      response: Response.json(
        { error: 'Cron authentication is not configured' },
        { status: 503 }
      ),
    };
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true };
}
