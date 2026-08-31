// Environment variables validation for production
const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co')
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    description: 'Supabase service role key',
    validator: (value) => value.startsWith('eyJ') && value.length > 100
  },
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    required: true,
    description: 'Supabase browser publishable key',
    validator: (value) => value.length > 20
  },
  
  // AI
  GROQ_API_KEY: {
    required: true,
    description: 'Groq API key for AI chat',
    validator: (value) => value.startsWith('gsk_')
  },
  
  // Stripe
  STRIPE_SECRET_KEY: {
    required: true,
    description: 'Stripe secret key',
    validator: (value) => value.startsWith('sk_') && value.length > 20
  },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    required: true,
    description: 'Stripe publishable key',
    validator: (value) => value.startsWith('pk_') && value.length > 20
  },
  
  // hCaptcha
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: {
    required: true,
    description: 'hCaptcha site key',
    validator: (value) => value.length > 20
  },
  HCAPTCHA_SECRET_KEY: {
    required: true,
    description: 'hCaptcha secret key',
    validator: (value) => value.length > 20
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    description: 'Stripe webhook signing secret',
    validator: (value) => value.startsWith('whsec_') && value.length > 20
  },
  RESEND_API_KEY: {
    required: true,
    description: 'Resend transactional email API key',
    validator: (value) => value.startsWith('re_') && value.length > 20
  },
  EMAIL_FROM: {
    required: true,
    description: 'Verified transactional email sender',
    validator: (value) => value.includes('@') && value.length <= 320
  },
  CRON_SECRET: {
    required: true,
    description: 'Cron and diagnostics bearer secret',
    validator: (value) => value.length >= 32
  },
  NEXT_PUBLIC_SITE_URL: {
    required: true,
    description: 'Canonical public HTTPS origin',
    validator: (value) => /^https:\/\/[^/]+\/?$/.test(value)
  }
};

const optionalEnvVars = {
  NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY: {
    required: false,
    description: 'Stripe price ID for Creator monthly',
    validator: (value) => value.startsWith('price_')
  },
  NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL: {
    required: false,
    description: 'Stripe price ID for Creator annual',
    validator: (value) => value.startsWith('price_')
  },
  NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY: {
    required: false,
    description: 'Stripe price ID for Agency monthly',
    validator: (value) => value.startsWith('price_')
  },
  NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL: {
    required: false,
    description: 'Stripe price ID for Agency annual',
    validator: (value) => value.startsWith('price_')
  },
  STRIPE_PORTAL_CONFIGURATION_ID: {
    required: false,
    description: 'Stripe Customer Portal configuration for paid-plan changes',
    validator: (value) => value.startsWith('bpc_')
  },
  SENTRY_DSN: {
    required: false,
    description: 'Sentry DSN for error tracking',
    validator: (value) => value.startsWith('https://')
  },
  KNOWLEDGE_EMBEDDINGS_ENABLED: {
    required: false,
    description: 'Enable Supabase gte-small semantic knowledge retrieval',
    validator: (value) => ['0', '1'].includes(value)
  },
  KNOWLEDGE_EMBEDDINGS_SECRET: {
    required: false,
    description: 'Dedicated service-to-service secret for knowledge embedding inference',
    validator: (value) => value.length >= 32
  },
  KNOWLEDGE_GRAPH_ENABLED: {
    required: false,
    description: 'Enable draft knowledge graph extraction and verified graph retrieval',
    validator: (value) => ['0', '1'].includes(value)
  },
  KNOWLEDGE_MEMORY_ENABLED: {
    required: false,
    description: 'Enable owner-approved temporal memory and aggregate intent patterns',
    validator: (value) => ['0', '1'].includes(value)
  },
  GROQ_CHAT_MODEL: {
    required: false,
    description: 'Override the Groq model used for customer-facing agent replies',
    validator: (value) => /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
  },
  GROQ_FAST_MODEL: {
    required: false,
    description: 'Override the Groq model used for classification tasks',
    validator: (value) => /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
  },
  GROQ_DEMO_MODEL: {
    required: false,
    description: 'Override the Groq model used for the public demo',
    validator: (value) => /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
  },
  GROQ_KNOWLEDGE_GRAPH_MODEL: {
    required: false,
    description: 'Override the Groq model used for knowledge graph extraction',
    validator: (value) => /^[a-z0-9][a-z0-9._/-]+$/i.test(value)
  }
};

function validateEnvironmentVariables() {
  const errors = [];
  const warnings = [];

  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = key === 'HCAPTCHA_SECRET_KEY'
      ? (process.env.HCAPTCHA_SECRET_KEY || process.env.HCAPTCHA_SECRET)
      : process.env[key];
    
    if (!value) {
      errors.push(`❌ Missing required environment variable: ${key} - ${config.description}`);
    } else if (!config.validator(value)) {
      errors.push(`❌ Invalid format for ${key}: ${config.description}`);
    }
  });

  // Check optional variables
  Object.entries(optionalEnvVars).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (value && !config.validator(value)) {
      warnings.push(`⚠️ Invalid format for optional variable ${key}: ${config.description}`);
    }
  });

  if (process.env.KNOWLEDGE_MEMORY_ENABLED === '1' && process.env.KNOWLEDGE_GRAPH_ENABLED !== '1') {
    errors.push('❌ KNOWLEDGE_GRAPH_ENABLED must be 1 before KNOWLEDGE_MEMORY_ENABLED can be enabled');
  }
  if (process.env.KNOWLEDGE_EMBEDDINGS_ENABLED === '1' && !process.env.KNOWLEDGE_EMBEDDINGS_SECRET) {
    errors.push('❌ KNOWLEDGE_EMBEDDINGS_SECRET is required when KNOWLEDGE_EMBEDDINGS_ENABLED=1');
  }

  // Environment-specific checks
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isProduction) {
    // Production-specific validations
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      errors.push('❌ Using test Stripe key in production environment');
    }

    const requiredStripePrices = [
      'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY',
      'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL',
      'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY',
      'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL',
      'STRIPE_PORTAL_CONFIGURATION_ID',
    ];

    requiredStripePrices.forEach((key) => {
      if (!process.env[key]) {
        errors.push(`❌ Missing required environment variable: ${key} - Stripe price ID`);
      }
    });
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('❌ Using localhost Supabase URL in production');
    }

    if (process.env.NEXT_PUBLIC_SITE_URL !== 'https://www.qlynk.site') {
      errors.push('❌ NEXT_PUBLIC_SITE_URL must use the canonical production origin https://www.qlynk.site');
    }

    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
      errors.push('❌ Using test Stripe publishable key in production environment');
    }
  }

  if (isDevelopment) {
    // Development-specific checks
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('⚠️ Using live Stripe key in development environment');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRequired: Object.keys(requiredEnvVars).length,
      configuredRequired: Object.keys(requiredEnvVars).filter((key) => {
        if (key === 'HCAPTCHA_SECRET_KEY') {
          return Boolean(process.env.HCAPTCHA_SECRET_KEY || process.env.HCAPTCHA_SECRET);
        }
        return Boolean(process.env[key]);
      }).length,
      totalOptional: Object.keys(optionalEnvVars).length,
      configuredOptional: Object.keys(optionalEnvVars).filter(key => process.env[key]).length
    }
  };
}

function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  };
}

export { validateEnvironmentVariables, getEnvironmentInfo, requiredEnvVars, optionalEnvVars };
