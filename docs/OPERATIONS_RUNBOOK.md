# Qlynk Production Operations Runbook

Use this runbook after deploying a release and during incidents. Never paste API keys, authorization headers, private conversations, document contents, or service-role credentials into tickets or public logs.

## Release identification

Record the following for every production release:

- Git commit/tag
- Vercel deployment URL and deployment ID
- deployment time and operator
- database migrations applied
- Stripe webhook endpoint version/configuration
- smoke-test result

## Required monitors

Configure an external uptime service to request `GET https://www.qlynk.site/api/health` at least every five minutes. The public response must contain only `{"status":"ok"}`. Alert after two consecutive failures and on sustained latency above two seconds.

Configure error/log alerts for:

- HTTP 5xx rate above 5% for five minutes
- Stripe webhook responses at 5xx or webhook ledger rows remaining `failed`
- webhook ledger rows remaining `processing` for more than ten minutes
- failed Vercel cron invocations
- Groq errors, timeouts, or unusual request growth
- Resend failures
- repeated shared-rate-limiter fallback messages
- Supabase database or storage usage above 80%
- abnormal signup, scraping, chat, or password-attempt volume

Detailed `/api/status` and `/api/errors` requests require `Authorization: Bearer <CRON_SECRET>`. Use them only from a secure monitor or operator workstation. Never put this URL/header in public status pages.

## Daily checks during launch week

1. Review Vercel function failures and latency.
2. Review Stripe webhook delivery failures and retry queue.
3. Check `stripe_webhook_events` for failed or stale processing rows.
4. Confirm both scheduled cron routes ran successfully.
5. Review Groq and Resend usage/failures.
6. Review Supabase database and storage capacity.
7. Confirm signup, checkout, and chat conversions have no sudden drop.

## Incident triage

1. Identify the affected flow, start time, deployment, and scope.
2. Check the minimal public health endpoint.
3. Check Vercel logs using event/request IDs, not customer content.
4. Check Supabase health and recent migrations.
5. For billing incidents, check Stripe delivery attempts and the matching `stripe_webhook_events.event_id`.
6. For AI incidents, check Groq status, timeout/error rate, and message usage.
7. Contain abuse with shared limiter thresholds or Vercel firewall controls.
8. Roll back the application if the current deployment introduced the failure.
9. Do not roll back a database migration by restoring an old database without evaluating data loss and application compatibility.
10. Document impact, remediation, and any notification decision.

## Stripe webhook recovery

- A failed event must have a `failed` ledger row and an HTTP 5xx delivery in Stripe.
- Resolve the underlying database/email/configuration failure, then use Stripe's retry control.
- Replaying an event is safe: completed event IDs are ignored and Resend emails use event-based idempotency keys.
- Do not manually set a subscription active without confirming the Checkout Session payment state, Stripe subscription state, configured price ID, and Qlynk user metadata.

## Credential compromise

1. Identify the exposed credential and systems that used it.
2. Rotate it at the provider immediately.
3. Update Vercel production and preview environments separately.
4. Redeploy and verify affected integrations.
5. Review provider and application access logs for misuse.
6. Revoke old webhook secrets/keys after the new deployment is healthy.
7. Evaluate legal/customer notification requirements.

## Backups and restoration

Before launch, record the Supabase plan's database backup frequency and retention. Confirm how Storage objects are recovered; database backups may not include Storage object contents.

Perform a restoration drill into a separate non-production project:

1. Select a known backup point.
2. Restore or clone it into an isolated project.
3. Apply only migrations appropriate for the restored point.
4. Verify row counts and two controlled accounts.
5. Verify private views/RLS and document bucket privacy.
6. Verify a sample profile, agent configuration, knowledge record, conversation, subscription, and document record.
7. Record duration, missing data, operator, and corrective actions.
8. Destroy the isolated restored data securely after the drill.

Never test restoration by overwriting the production database.

## Application rollback

1. Select the last known-good Vercel deployment.
2. Confirm it is compatible with already-applied database migrations.
3. Promote/rollback through Vercel.
4. Run public health, login, public chat, and billing reconciliation smoke tests.
5. Monitor errors and webhook delivery for at least 30 minutes.
6. Record the rollback reason and follow-up fix.

## Launch alert test

Before approving launch:

- Trigger a controlled test error and confirm the error alert arrives.
- Trigger or simulate a failed cron and confirm the cron alert arrives.
- Use a Stripe test-mode failed webhook and confirm the delivery/ledger alert arrives.
- Confirm the on-call recipient can access Vercel, Supabase, Stripe, Groq, Resend, DNS, and the domain registrar.
- Confirm escalation ownership and a backup contact.
