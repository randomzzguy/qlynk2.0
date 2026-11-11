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
4. Confirm all configured scheduled cron routes ran successfully.
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

## Message quota repair

Run `npm run verify:message-quota` against the configured database before releasing quota changes. It calls the reservation RPC with a random nonexistent owner, without changing customer records. The July RPC returns an obsolete lifetime count and fails this check; the monthly RPC passes.

On 2026-11-08 the connected database still had the July implementation: reservations incremented `messages_used` without advancing `last_reset_at`. The dashboard and billing page deliberately show zero for a previous UTC month, hiding those reservations. An affected account had seven stored visitor prompts this month and zero displayed usage.

Apply `supabase/migrations/20261108010000_repair_monthly_message_quota.sql` through the normal migration process or the project's Supabase SQL Editor. This focused repair can be applied independently of the broader free-plan rollout. It installs atomic UTC month rollover and restores stale counters from this month's stored user messages. Assistant replies are excluded, current-period reservations are preserved, and billing/plan fields are unchanged. Deleted history and unsaved requests cannot be reconstructed for stale periods.

After applying, run `npm run verify:message-quota` again and reload the dashboard/billing page. Both pages fetch subscription state on mount; an already-open page needs a reload to display the updated count. Record a manually applied migration in the migration ledger before later CLI releases.

Local validation: 156 tests passed, including reproducing the old database/display mismatch, repairing counts, rollover, plan caps, paused accounts, repeat application and RPC permissions. All 56 migrations and security invariants passed. The live repair was not applied in this session: linked database authentication failed and browser input was interrupted by active user input.

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

Run `npm run verify:backups` before a production release. It uses the explicitly configured project or derives it from `NEXT_PUBLIC_SUPABASE_URL`, rejects mismatches, and requires an operator-only `SUPABASE_ACCESS_TOKEN` with `backups_read` access. There is no default production project and no shell-based CLI invocation. It fails when metadata cannot be read or there is no completed backup/valid PITR range within `BACKUP_MAX_AGE_HOURS` (default 48). PITR enabled alone is insufficient. Exit zero means only that a recent recovery point is advertised, not that recovery is accessible on the current plan or that a restore drill succeeded.

The local check on 2026-11-11 could not read live backup metadata because the management token was not configured. No live recovery point, Storage-file backup or restoration drill has been verified in this rollout.

The scheduled GitHub workflow in `.github/workflows/production-monitor.yml` checks public health every 15 minutes. Add the repository Actions secret `PRODUCTION_CRON_SECRET` to enable its protected diagnostics check. Keep GitHub Actions failure notifications enabled for the maintainers responsible for production.

Before launch, record the Supabase plan's database backup frequency and retention. Confirm how Storage objects are recovered; database backups may not include Storage object contents.

For a zero-cost backup process, follow Supabase's [database export and restore guidance](https://supabase.com/docs/guides/platform/backups) and keep exports off the production project. Back up uploaded Storage objects separately, not just their database metadata. Choose an encrypted destination with sufficient space and a responsible operator before exporting private data. Do not place dumps in Git, public buckets, or ordinary CI logs/artifacts. An export existing is not proof of recoverability: perform the isolated restore drill below and verify files as well as database records. No automated export, retention deletion, or restore is installed by the resilience rollout.

## Capacity and stalled-request checks

Apply `20261111040000_add_resilience_snapshot.sql` after the previous resilience migrations. Run `npm run report:resilience` to read an aggregate snapshot. It exits nonzero for warnings, critical conditions, missing data or errors. Database and Storage thresholds default to 500,000,000 and 1,000,000,000 bytes; adjust `MONITOR_DATABASE_LIMIT_BYTES` and `MONITOR_STORAGE_LIMIT_BYTES` to the account's actual allowance. Warnings start at 80%, critical at 95%.

`GET /api/health/resilience` exposes the same report only to callers presenting `Authorization: Bearer <CRON_SECRET>`, including in development. It returns 503 for warnings/critical conditions or unavailable checks. Public health remains unchanged. The snapshot includes application AI request/token/concurrency usage, shared cooldowns and expired pending chat reservations. It never returns message content, object names or credentials. An expired reservation is not changed by the monitor; normal reservation recovery still runs on a subsequent request for that owner.

After deployment and a manual endpoint check, set repository variable `PRODUCTION_RESILIENCE_MONITOR_ENABLED=1` to opt the existing 15-minute GitHub monitor into this endpoint. The existing `PRODUCTION_CRON_SECRET` Actions secret is required. Without opt-in, nothing changes in the live monitor. Actions notification delivery is still controlled by maintainers' GitHub settings; no recipient or delivery test has been configured here.

These are point-in-time measurements, not historical growth forecasts. Storage uses metadata sizes and explicitly flags objects without usable sizes. Database bytes exclude total disk/WAL pressure, and the quota model does not include other applications using the same Groq organization. Review the Supabase dashboard for disk/WAL and egress, and Vercel for hosting consumption. Provider backup status remains a separate operator check. Investigate transient AI concurrency alerts in context; the monitor does not claim every warning is an outage.

Retention is deliberately unchanged. Before enabling cleanup, agree which conversation history must be kept, whether failed/empty conversations can expire, how completed request IDs remain available for safe replay, and where archived data will live. Do not remove completed request records independently of conversation retention without defining the retry horizon. The existing 24-hour AI budget cleanup continues on later calls for each active scope/model.

## Isolated restoration drill

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
