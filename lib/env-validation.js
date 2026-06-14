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
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    description: 'Stripe webhook secret',
    validator: (value) => value.startsWith('whsec_')
  },
  SENTRY_DSN: {
    required: false,
    description: 'Sentry DSN for error tracking',
    validator: (value) => value.startsWith('https://')
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

  // Environment-specific checks
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isProduction) {
    // Production-specific validations
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('⚠️ Using test Stripe key in production environment');
    }

    const requiredStripePrices = [
      'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY',
      'NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL',
      'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY',
      'NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL',
    ];

    requiredStripePrices.forEach((key) => {
      if (!process.env[key]) {
        errors.push(`❌ Missing required environment variable: ${key} - Stripe price ID`);
      }
    });
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('❌ Using localhost Supabase URL in production');
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
