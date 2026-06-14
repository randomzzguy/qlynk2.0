import { monitoring } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const errorData = await req.json();
    
    // Validate required fields
    if (!errorData.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Track the client error
    const trackedError = monitoring.trackError(
      new Error(errorData.message),
      {
        ...errorData.context,
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
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
