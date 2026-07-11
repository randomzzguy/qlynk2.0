import { monitoring } from '@/lib/monitoring';
import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { canAccessDetailedDiagnostics } from '@/lib/diagnostics-auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const rateLimit = await rateLimitResponse(req, 'client-errors', 10, 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const rawBody = await req.text();
    if (rawBody.length > 16_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let errorData;
    try {
      errorData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    // Validate required fields
    if (typeof errorData.message !== 'string' || !errorData.message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const message = errorData.message.trim().slice(0, 2_000);
    const context = errorData.context && typeof errorData.context === 'object'
      ? {
          url: typeof errorData.context.url === 'string' ? errorData.context.url.slice(0, 2_048) : undefined,
          component: typeof errorData.context.component === 'string' ? errorData.context.component.slice(0, 200) : undefined,
          action: typeof errorData.context.action === 'string' ? errorData.context.action.slice(0, 200) : undefined,
        }
      : {};

    // Track the client error
    const trackedError = monitoring.trackError(
      new Error(message),
      {
        ...context,
        type: 'client',
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      }
    );

    return NextResponse.json({ 
      received: true,
      errorId: trackedError.timestamp,
      timestamp: trackedError.timestamp
    });

  } catch (error) {
    console.error('Error tracking client error:', error);
    return NextResponse.json({ 
      error: 'Failed to track error',
      received: false 
    }, { status: 500 });
  }
}

export async function GET(req) {
  if (!canAccessDetailedDiagnostics(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metrics = monitoring.getMetrics();
  
  return NextResponse.json({
    metrics: {
      requests: metrics.requests,
      errors: metrics.errors,
      errorRate: metrics.errorRate,
      avgResponseTime: metrics.avgResponseTime,
      uptime: metrics.uptime
    },
    recentErrors: metrics.recentErrors.slice(-5), // Last 5 errors
    timestamp: new Date().toISOString()
  });
}
