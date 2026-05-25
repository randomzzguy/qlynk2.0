// Simple error tracking and monitoring system
class MonitoringSystem {
  constructor() {
    this.errors = [];
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      lastReset: Date.now()
    };
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Track an error
  trackError(error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: context.userAgent,
      url: context.url,
      userId: context.userId,
      severity: this.getErrorSeverity(error)
    };

    this.errors.push(errorData);
    this.metrics.errors++;

    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('[Monitoring Error]', errorData);
    }

    // Send to external service if configured
    if (process.env.SENTRY_DSN) {
      this.sendToSentry(errorData);
    }

    return errorData;
  }

  // Track a request
  trackRequest(duration, statusCode, context = {}) {
    this.metrics.requests++;
    this.metrics.responseTime.push(duration);

    // Keep only last 100 response times
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-100);
    }

    // Track slow requests
    if (duration > 2000) {
      this.trackError(new Error(`Slow request: ${duration}ms`), {
        ...context,
        type: 'performance',
        statusCode
      });
    }
  }

  // Get error severity
  getErrorSeverity(error) {
    if (error.message.includes('Database') || error.message.includes('Supabase')) {
      return 'high';
    }
    if (error.message.includes('Stripe') || error.message.includes('payment')) {
      return 'high';
    }
    if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      return 'medium';
    }
    return 'low';
  }

  // Send to Sentry (if configured)
  async sendToSentry(errorData) {
    try {
      // This would integrate with Sentry SDK
      // For now, we'll just log it
      if (this.isProduction) {
        console.error('[Sentry]', errorData);
      }
    } catch (sentryError) {
      console.error('Failed to send to Sentry:', sentryError);
    }
  }

  // Get metrics summary
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    const errorRate = this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100 
      : 0;

    return {
      ...this.metrics,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      recentErrors: this.errors.slice(-10)
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      lastReset: Date.now()
    };
  }
}

// Global monitoring instance
const monitoring = new MonitoringSystem();

// Middleware for API routes
export function withMonitoring(handler) {
  return async (req, ...args) => {
    const startTime = Date.now();
    const context = {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    };

    try {
      const result = await handler(req, ...args);
      
      const duration = Date.now() - startTime;
      monitoring.trackRequest(duration, result.status || 200, context);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.trackError(error, { ...context, duration });
      
      monitoring.trackRequest(duration, 500, context);
      
      throw error;
    }
  };
}

// Client-side error tracking
export function trackClientError(error, context = {}) {
  if (typeof window !== 'undefined') {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: window.userId || null
      },
      type: 'client'
    };

    // Send to server endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // Silently fail if error tracking fails
    });
  }
}

// Error endpoint for client errors
export async function handleClientError(errorData) {
  monitoring.trackError(new Error(errorData.message), errorData.context);
  return Response.json({ received: true });
}

export { monitoring };
