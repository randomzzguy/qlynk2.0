import { authorizeCronRequest } from '@/lib/cron-auth';

// Compatibility endpoint for old cron schedules. Creator never expires.
export async function GET(request) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) return authorization.response;
  return Response.json({ success: true, retired: true, message: 'Creator is free with no trial expiry.' });
}
