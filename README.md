# Qlynk

AI-powered agent platform that lets creators build personalized chatbots for their websites.

## Features

- **AI Chat Widget** - Embeddable chat agent that answers questions based on user knowledge
- **Customizable Themes** - Dark tech aesthetic with color, position, and branding options
- **Knowledge Base** - Upload documents, add custom facts, or scrape URLs
- **Agent Types & Rules** - Personal, business, property, operations, product, support, and custom guides with structured scope controls
- **Analytics Dashboard** - Track conversations, sentiment, and engagement
- **Free Trial** - 14-day trial with automatic subscription management
- **Stripe Integration** - Subscription billing with webhook support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth with hCaptcha |
| AI | Groq API (LLM streaming) |
| Payments | Stripe |
| Styling | Tailwind CSS + Framer Motion |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.local.example .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL=
NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL=

# Security
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
```

## Deployment

See [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) for production deployment steps.

## Verification

Run the same quality gates used by CI before deployment:

```bash
npm test
npm run lint
npm run verify:migrations
npm run verify:env
npm run build
npm run verify:http # while npm start is running; set SMOKE_BASE_URL if not port 3100
npm run verify:integrations # read-only production provider connectivity/domain checks
npm audit --omit=dev --audit-level=high
```

`npm test` contains focused regression coverage for safe URL scraping, document validation, Stripe plan activation, Stripe webhook idempotency, and trusted client-IP selection. `verify:migrations` executes every migration in embedded Postgres and verifies RLS, privileges, private views/storage, webhook isolation, and the shared rate limiter.

Agent behavior is composed server-side in a fixed priority order: immutable Qlynk policy, approved agent-type template, validated owner rules, bounded relevant knowledge, and untrusted visitor messages. Owner rules and version history are service-managed private data and are never returned by the public agent view. Chat requests also use atomic monthly credit reservation, per-IP, per-agent, and per-visitor limits, optional owner daily caps, direct jailbreak detection, scope classification, and a fixed output-token ceiling.

`npm run verify:env` validates `.env.local` as production configuration without printing secret values. Run the equivalent check against the deployment environment before promoting a release.

Authenticated browser smoke tests still require a configured Supabase/Stripe test environment; follow `LAUNCHREADY.md` before a production launch.

## Project Structure

```
app/
  api/           # API routes (AI chat, webhooks, auth)
  auth/          # Login/signup pages
  dashboard/     # User dashboard (agent config, analytics)
  [username]/    # Public profile pages with chat widget
  embed/         # Embeddable widget for external sites

components/      # React components
lib/            # Utilities, database helpers
utils/          # Supabase clients
supabase/       # Database migrations
public/         # Static assets
scripts/        # Build scripts
```

## License

Private - All rights reserved.
