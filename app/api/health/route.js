import { createAdminClient } from '@/utils/supabase/server';
import { validateEnvironmentVariables, getEnvironmentInfo } from '@/lib/env-validation';
import { NextResponse } from 'next/server';
import { canAccessDetailedDiagnostics, publicHealthResponse } from '@/lib/diagnostics-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const detailedDiagnosticsAllowed =
    process.env.NODE_ENV !== 'production' || canAccessDetailedDiagnostics(request);

  if (!detailedDiagnosticsAllowed) {
    return publicHealthResponse(NextResponse);
  }

  try {
    const startTime = Date.now();
    const envValidation = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    
    // Basic health checks
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      uptime: process.uptime(),
      responseTime: 0,
      environment: envInfo,
      environmentValidation: {
        isValid: envValidation.isValid,
        configured: {
          required: envValidation.summary.configuredRequired,
          optional: envValidation.summary.configuredOptional
        }
      }
    };

    // Test database connection
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      healthChecks.database = {
        status: error ? 'unhealthy' : 'healthy',
        error: error ? error.message : null
      };
    } catch (dbError) {
      healthChecks.database = {
        status: 'unhealthy',
        error: dbError.message
      };
    }

    // Test external services
    const serviceChecks = await Promise.allSettled([
      // Test Groq API
      (async () => {
        if (!process.env.GROQ_API_KEY) return { status: 'skipped', reason: 'No API key' };
        
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000)
        });
        
        return {
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status
        };
      })(),
      
      // Test Stripe API
      (async () => {
        if (!process.env.STRIPE_SECRET_KEY) return { status: 'skipped', reason: 'No API key' };
        
        const response = await fetch('https://api.stripe.com/v1/account', {
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
          signal: AbortSignal.timeout(5000)
        });
        
        return {
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status
        };
      })()
    ]);

    healthChecks.services = {
      groq: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'error', error: serviceChecks[0].reason?.message },
      stripe: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'error', error: serviceChecks[1].reason?.message }
    };

    // Calculate overall health
    const allHealthy = 
      envValidation.isValid &&
      healthChecks.database.status === 'healthy' &&
      (!healthChecks.services.groq || healthChecks.services.groq.status === 'healthy' || healthChecks.services.groq.status === 'skipped') &&
      (!healthChecks.services.stripe || healthChecks.services.stripe.status === 'healthy' || healthChecks.services.stripe.status === 'skipped');

    healthChecks.status = allHealthy ? 'healthy' : 'degraded';
    healthChecks.responseTime = Date.now() - startTime;

    const statusCode = allHealthy ? 200 : 503;
    
    return NextResponse.json(healthChecks, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'production' && !canAccessDetailedDiagnostics(request)) {
      return publicHealthResponse(NextResponse);
    }

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
