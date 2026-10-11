# Qlynk

Build focused AI agents from knowledge you approve, then share a public link or embed a website widget.

**Qlynk is open source under [MIT](LICENSE).** Use [hosted Qlynk](https://www.qlynk.site) or run your own deployment.

| Hosted plan | USD price | Messages per calendar month | Agents | Branding |
| --- | --- | --- | --- | --- |
| Creator | Free, no expiry or card | 5,000 | 1 | Powered by Qlynk |
| Agency | $38/month or $360/year | 10,000 | 1 | Attribution removed |

Both hosted plans include knowledge, facts, FAQs, PDF/DOCX/TXT documents (up to 3 MB per file), scope and response rules, public pages, website widgets, visitor access controls, conversations, analytics and knowledge gaps. There is no separate Agency storage allowance in this release. Message usage resets at the start of each UTC calendar month. Agency is optional; cancellation returns accounts to Creator when it takes effect.

Self-hosting uses your own infrastructure and provider credentials. The source is free to use under MIT; hosting and AI provider usage can incur costs. The hosted plan allowances describe Qlynk’s managed service. A self-hosting operator controls their deployment’s configuration and must apply consistent app and database changes if they change allowances.

## Stack

Next.js 16 (App Router), React 19, Supabase Auth/Postgres/Storage, Groq inference, Tailwind CSS and Framer Motion. Stripe supports optional Agency billing; Resend supports optional transactional notifications. Supabase handles signup and password-reset email separately.

## Local setup

Prerequisites: Node.js 22 or later, npm, a Supabase project you control, and a Groq API key. Use development providers and Stripe test mode for local work.

1. Clone the repository and install the locked dependencies:

   ```bash
   git clone https://github.com/randomzzguy/qlynk2.0.git
   cd qlynk2.0
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase URL, browser publishable key, server-only service-role key, and Groq key. On PowerShell, use `Copy-Item .env.example .env.local`; on macOS/Linux use `cp .env.example .env.local`. Never put the service-role key in a `NEXT_PUBLIC_` variable.

3. Initialize a **fresh development database**, applying every SQL file in `supabase/migrations/` in filename order. With an authenticated Supabase CLI:

   ```bash
   supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
   supabase db push
   ```

   Review the CLI’s pending migration list before applying. Never link local development to Qlynk production. Existing installations must compare their migration ledger with the repository before applying only missing migrations; do not replay migrations blindly. `npm run verify:migrations` checks the complete chain in embedded Postgres without touching any provider.

4. In Supabase Auth, configure Site URL as `http://localhost:3000` and allow `http://localhost:3000/auth/callback`. Configure Auth email delivery/confirmation and the templates in `supabase/email-templates/`. Use your production HTTPS origin and callback when deploying. Create an account through the app’s signup flow; it creates the profile, subscription and initial agent.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000). The existing hCaptcha bypass is limited to localhost development; use real hCaptcha keys for public deployments.

## Optional services

- **Agency billing:** Set `NEXT_PUBLIC_BILLING_ENABLED=1` and configure Stripe secret/webhook keys, Agency monthly/annual price IDs and a Customer Portal configuration. Allow only Agency prices in the portal catalog. Send Stripe webhook events to `/api/webhooks/stripe`; the legacy `/api/webhook` delegates there. Creator never needs checkout. Historical Creator price IDs are recognized only to reconcile old billing.
- **Email notifications:** Set a Resend key and verified `EMAIL_FROM`. Missing notification credentials must not be confused with Supabase’s separate Auth email requirements.
- **Scheduled workers:** Set a long random `CRON_SECRET` and schedule the relevant protected routes. Trial-expiry scheduling has been retired. Knowledge workers and account deletion still need scheduling. See `vercel.json` for hosted schedules.
- **Advanced knowledge processing:** Read [Knowledge Fabric](docs/KNOWLEDGE_FABRIC.md) before enabling embeddings, graph or memory. The embedding function and its dedicated secret require separate setup; do not enable flags without their dependencies.

## Deploy your instance

Set `NEXT_PUBLIC_SITE_URL` to your own HTTPS origin. Configure Supabase redirects, hCaptcha domains, verified email sender, secrets, backups and any optional Stripe integration for that instance. Build with `npm run build` and serve with `npm start`, or use a supported Next.js host. The site URL and billing flag are also build-time public variables: rebuild after changing them.

Database row-level security, private document storage, service-only billing updates, atomic message reservations and rate limits are required parts of the deployment. Public agents should contain only knowledge appropriate for their audience.

See [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md), [Operations Runbook](docs/OPERATIONS_RUNBOOK.md), and [Free Creator rollout](docs/FREE_CREATOR_OPEN_SOURCE_ROLLOUT.md).

## Verification

```bash
npm test
npm run lint
npm run verify:migrations
npm run verify:open-source
npm run build
npm run verify:http # with npm start running on port 3100; override SMOKE_BASE_URL as needed
```

The tests cover subscription transitions, authoritative Stripe state, quota behavior, authorization boundaries, safe document/URL processing, agent scope, and knowledge retrieval. CI uses placeholder providers for build and public HTTP checks; it does not prove live provider connectivity or a real checkout.

Production operators can additionally run `npm run verify:env`, `npm run verify:integrations` and `npm run verify:free-creator` using their deployment configuration. The last command is read-only: it checks Agency prices and detects historical paid Creator subscriptions requiring reconciliation. `npm run verify:production-isolation` creates test fixtures and should only be run against an explicitly selected test project.

## Contribute and report issues

Read [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include provider secrets, customer documents or visitor transcripts in issues or pull requests.

## License

The source is licensed under [MIT](LICENSE), using the [OSI MIT license text](https://opensource.org/license/mit). Third-party dependencies and separately licensed assets retain their own terms. The hosted service’s [Terms](https://www.qlynk.site/terms) and [Privacy Policy](https://www.qlynk.site/privacy) govern use of hosted Qlynk; publishing source code does not publish customer data.
