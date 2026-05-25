import { createClient } from '@/utils/supabase/server';
import { validateEnvironmentVariables, getEnvironmentInfo } from '@/lib/env-validation';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envValidation = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    const startTime = Date.now();
    
    // Database metrics
    const supabase = createClient();
    let dbMetrics = {};
    
    try {
      // Get table counts
      const [profilesCount, conversationsCount, knowledgeCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('agent_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('agent_knowledge').select('id', { count: 'exact', head: true })
      ]);

      dbMetrics = {
        tables: {
          profiles: profilesCount.count || 0,
          conversations: conversationsCount.count || 0,
          knowledge: knowledgeCount.count || 0
        },
        status: 'connected'
      };
    } catch (dbError) {
      dbMetrics = {
        status: 'error',
        error: dbError.message
      };
    }

    // System metrics
    const systemMetrics = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      responseTime: Date.now() - startTime
    };

    // Feature flags and capabilities
    const features = {
      urlScraping: true,
      sentimentAnalysis: true,
      csvExport: true,
      stripeIntegration: !!process.env.STRIPE_SECRET_KEY,
      errorTracking: !!process.env.SENTRY_DSN,
      fileUploads: true,
      realTimeChat: true
    };

    // Security status
    const security = {
      httpsEnabled: process.env.NODE_ENV === 'production',
      envVarsValid: envValidation.isValid,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasRequiredKeys: envValidation.summary.configuredRequired === envValidation.summary.totalRequired
    };

    // Free tier monitoring
    let freeTierUsage = {};
    try {
      // Get database size (approximate)
      const { data: dbSize } = await supabase
        .rpc('get_database_size'); // This would need to be created in Supabase
      
      // Get storage usage
      const { data: storageData } = await supabase.storage
        .from('agent-documents')
        .list('', { limit: 1000 });
      
      const totalStorageSize = storageData?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;

      freeTierUsage = {
        database: {
          used: dbSize || 0, // in MB
          limit: 500, // Free tier limit
          percentage: Math.round(((dbSize || 0) / 500) * 100)
        },
        storage: {
          used: Math.round(totalStorageSize / 1024 / 1024), // Convert to MB
          limit: 1024, // 1GB in MB
          percentage: Math.round((totalStorageSize / 1024 / 1024 / 1024) * 100)
        },
        users: {
          active: recentActivity.signups24h || 0,
          limit: 50000, // Free tier monthly limit
          percentage: Math.round(((recentActivity.signups24h || 0) / 50000) * 100)
        },
        status: 'healthy' // Will be updated based on usage
      };

      // Determine overall free tier status
      const highUsage = 
        freeTierUsage.database.percentage > 80 ||
        freeTierUsage.storage.percentage > 80 ||
        freeTierUsage.users.percentage > 80;
      
      freeTierUsage.status = highUsage ? 'warning' : 'healthy';
      
    } catch (usageError) {
      freeTierUsage = {
        status: 'error',
        error: usageError.message
      };
    }

    // Recent activity (last 24 hours)
    let recentActivity = {};
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const [recentConversations, recentSignups] = await Promise.all([
        supabase
          .from('agent_conversations')
          .select('id')
          .gte('created_at', twentyFourHoursAgo)
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', twentyFourHoursAgo)
          .select('id', { count: 'exact', head: true })
      ]);

      recentActivity = {
        conversations24h: recentConversations.count || 0,
        signups24h: recentSignups.count || 0,
        period: '24 hours'
      };
    } catch (activityError) {
      recentActivity = {
        error: activityError.message,
        period: '24 hours'
      };
    }

    const statusReport = {
      timestamp: new Date().toISOString(),
      status: envValidation.isValid && dbMetrics.status === 'connected' ? 'operational' : 'degraded',
      environment: envInfo,
      database: dbMetrics,
      system: systemMetrics,
      features,
      security,
      recentActivity,
      freeTierUsage,
      environmentValidation: {
        isValid: envValidation.isValid,
        errors: envValidation.errors,
        warnings: envValidation.warnings,
        summary: envValidation.summary
      },
      version: process.env.npm_package_version || '0.1.0'
    };

    const statusCode = statusReport.status === 'operational' ? 200 : 503;
    
    return NextResponse.json(statusReport, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
