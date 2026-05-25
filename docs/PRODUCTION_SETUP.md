# Production Setup Guide

## Supabase Production Configuration

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose **Free Plan** (perfect for getting started)
4. Select a region close to your users
5. Set strong database password
6. Wait for project to be created (2-3 minutes)

### 2. Environment Variables

Create a new `.env.production` file with your production values:

```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Groq AI
GROQ_API_KEY=your-groq-api-key

# Stripe Production
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key

# Optional: Error Tracking
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 3. Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_owner ON agent_conversations(agent_owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_user ON agent_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_documents_user ON agent_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- Update RLS policies for production
-- (These should already be set from development)
```

### 4. Authentication Configuration

In Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `https://yourdomain.com`
2. **Redirect URLs**: 
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/*`
3. **Enable email confirmation**: ✅
4. **Set up email templates** with your branding

### 5. Storage Setup

1. Go to Storage → Settings
2. Create `agent-documents` bucket if not exists
3. Set up access policies:
   - Authenticated users can upload to their own folders
   - Public read access for processed documents

### 6. Webhook Configuration

1. In Stripe Dashboard → Webhooks:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

## Monitoring & Error Tracking

### Sentry Setup (Optional but Recommended)

1. Create account at [sentry.io](https://sentry.io)
2. Create new Next.js project
3. Install Sentry:

```bash
npm install @sentry/nextjs
```

4. Create `sentry.client.config.js`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

5. Create `sentry.server.config.js`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

6. Update `next.config.ts`:

```javascript
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  // your existing config
});
```

## Health Checks

The application includes built-in health check endpoints:

- `/api/health` - Basic health status
- `/api/status` - Detailed system status

## Security Checklist

- [ ] All API keys are environment variables
- [ ] Row Level Security enabled on all tables
- [ ] Strong database password used
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

## Performance Optimization

- [ ] Database indexes created
- [ ] Image optimization enabled
- [ ] CDN configured
- [ ] Caching headers set
- [ ] Bundle size optimized

## Deployment Steps

1. **Prepare Environment**
   - Set all production environment variables
   - Run database migrations
   - Test all integrations

2. **Deploy Application**
   - Build production version: `npm run build`
   - Deploy to your hosting platform
   - Update DNS if needed

3. **Post-Deployment**
   - Test all user flows
   - Monitor error rates
   - Set up alerts
   - Backup database

## Monitoring Setup

### Key Metrics to Monitor:
- Error rates
- Response times
- Database performance
- User engagement
- Subscription conversions

### Alert Thresholds:
- Error rate > 5%
- Response time > 2s
- Database connections > 80%
- Failed payments > 10%

## Backup Strategy

1. **Database**: Daily automated backups (Supabase handles this)
2. **Storage**: Weekly document storage backups
3. **Code**: Git version control
4. **Configuration**: Environment variables documented

## Scaling Considerations

- **Database**: Monitor connection pool usage
- **Storage**: Monitor file upload limits
- **API**: Consider rate limiting per user
- **CDN**: Use for static assets
- **Load Balancer**: For high traffic scenarios
