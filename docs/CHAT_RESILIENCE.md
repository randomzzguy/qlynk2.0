# Chat resilience rollout

## Step 1: explicit provider failures

The hosted and embedded agent chat route uses `lib/chat-provider.js` for scope
classification and answer generation. Upstream quota failures return HTTP 429,
`AI_RATE_LIMITED`, and a `Retry-After` header, preserving the provider's delay
(including HTTP-date values). Missing or invalid retry timing defaults to 60
seconds. Other provider failures return HTTP 503 and a safe availability message.
Provider response bodies are never sent to visitors.

Provider requests share a deadline 25 seconds after route entry, within the
route's 30-second platform limit. Scope classification has an additional 6-second
limit. Cancellation remains connected to the visitor request and response body.
A provider failure during scope classification stops processing in every scope
mode; it neither permits an unchecked request nor labels an outage as off-topic.

The existing chat clients display API error messages. No automatic POST replay
is introduced. This deadline bounds provider
work, not general database operations. Step 3 adds shared admission control to
demo and background requests as well.

Verification: `node --test tests/chat-provider.test.mjs`, `npm test`,
`npm run lint`, and `npm run build`. Tests mock the provider; they do not consume
live AI quota or demonstrate production concurrency capacity.

## Step 2: refundable, idempotent message reservations

Apply `supabase/migrations/20261111010000_add_chat_credit_reservations.sql`
**before deploying the updated application**, then run `npm run verify:message-quota`
with production credentials. This readiness probe uses a nonexistent owner and
does not change customer records. The app deliberately fails closed if the new
RPCs are missing; it does not fall back to charging through the legacy RPC.

The private request ledger reserves one monthly credit per request ID. Its
subscription-row lock serializes competing reservations, completion, release,
and month rollover. Each attempt has a separate token so delayed workers cannot
settle or refund a replacement attempt. Completed requests replay their saved
answer without another credit or AI call. Visitor, content/context fingerprint,
and conversation ownership are checked before reuse.

Normal errors release the credit immediately. The streaming path settles only
after a nonempty answer and the provider's `[DONE]` marker; both chat messages
and settlement are saved atomically before the browser receives `[DONE]`.
Truncated streams, cancellation, and persistence errors release the reservation.
A late refund from an earlier month cannot decrease the current month's usage.
If a process dies or the database is unavailable, the two-minute reservation
lease is recovered on the next reservation for that owner. Until then, its
pending credit can remain visible; no periodic recovery job is added yet.

Hosted and widget clients reuse the request ID when resubmitting the same failed
message in the current mounted chat, restore the input, and remove incomplete
assistant output. Stream framing is shared and handles split network chunks.
Reloading the page does not preserve this retry state. Older clients without
request IDs remain supported but cannot receive duplicate-request protection.

History contains completed exchanges only. Failed first attempts can leave an
empty conversation for reuse. Genuine policy refusals remain billable completed
responses, as before. Notification email behavior is unchanged and can precede
successful generation. Existing historical charges are not retroactively altered.

Tests cover refunds, duplicate and overlapping submissions, stale workers,
month rollover, atomic persistence failures, permissions, stream failures and
cancellation. Embedded PostgreSQL serializes queries; these tests are not a
production multi-connection load test.

## Step 3: shared provider admission and background priority

Apply `supabase/migrations/20261111020000_add_shared_groq_budgets.sql` after
the credit migration and before deploying. Run `npm run verify:ai-budget` with
the target deployment's credentials/configuration. This checks configuration and
RPC availability without creating budget records or calling Groq; it does not
verify your Groq organization's real limits.

All runtime Groq completion calls now go through `lib/groq-provider.js`: scope
classification, agent answers, sentiment, the public demo, and graph extraction.
The database locks one budget row per organization scope and model before
admitting a call. A reservation checks rolling one-minute and 24-hour request
and estimated token totals, plus active calls. It rejects overload promptly,
rather than holding functions open in a queue or automatically replaying POSTs.
Main chat failures use Step 2 to refund the visitor credit. The demo keeps its
static fallback when unavailable; background processing does not fail a reply.

Defaults per GPT-OSS model are 24 requests/minute, 800 requests/24h, 6,400
estimated tokens/minute, 160,000 estimated tokens/24h, and 3 active calls. These
are application budgets below the published free limits checked on 2026-11-11,
not a claim about the live account. Check [Groq's limits](https://console.groq.com/docs/rate-limits)
and your console before deployment. `GROQ_QUOTA_LIMITS_JSON` can specify a complete
five-field budget for each model (see `.env.example`). Unknown models fail closed
until configured. Changing these values cannot increase actual provider quotas.

`GROQ_QUOTA_SCOPE` must match across deployments using the same organization and
the same database. Rotating keys does not reset the shared budget. The demo shares
this scope even when it has a different key; set `GROQ_DEMO_QUOTA_SCOPE` separately
only if it belongs to a genuinely separate organization. Other applications or
deployments using a different database cannot be tracked by this limiter.

Sentiment and graph extraction are background calls. They may start only when no
other call is active for that model and their projected usage stays within 80%
of every request/token budget. This leaves headroom for foreground work but does
not preempt background calls already running. Sentiment now has a six-second
deadline. Graph jobs retain their existing retry behavior when deferred.

Tokens are estimated from UTF-8 payload size (three bytes per token), protocol
overhead and the full requested completion allowance. This is a cautious
heuristic, not an exact tokenizer or guaranteed ceiling. No cache hit is assumed.
Estimates remain counted for the rolling window even after errors or short
answers: refunding uncertain provider consumption could cause overspending.
This deliberately trades some throughput for protection. Step 4 adds measurement;
usage-based reconciliation, cache optimization and per-tenant fairness are not implemented.

An upstream 429 installs a shared cooldown from its retry timing. The shared
store failing stops new inference; there is no process-local fallback. Concurrency
slots release on response consumption, cancellation, or fetch failure, and expire
after 45 seconds if a worker disappears. Provider calls have at most a 30-second
deadline through this wrapper. Old rate-budget rows are removed on the next call
for their scope/model after 24 hours; inactive scopes can retain their last rows.
Tables store counts/timing/model identifiers, not API keys or message contents.
An individual request larger than its model budget returns 413 with guidance
instead of an endless 429 retry cycle.

Tests include 50 overlapping admissions, shared keys, request/token windows,
slot expiry, cancellation, provider cooldowns, background headroom and fail-closed
behavior. They use embedded PostgreSQL and mocked inference, not a live load test.

## Step 4: sentiment cadence and actual token measurements

Apply `supabase/migrations/20261111030000_add_ai_usage_and_sentiment_cadence.sql`
before deploying. `npm run verify:ai-budget` now also checks these RPCs with
nonexistent request/conversation IDs. No records or provider quota are consumed.

Optional sentiment analysis starts only after three visitor messages, then after
at least five additional visitor messages since the last successful analysis.
Every attempt (including one skipped due to quota) starts a five-minute cooldown.
The claim is atomic across instances. Stale workers cannot overwrite a newer
claim, and failed/invalid classification does not advance the analyzed count.
Only the latest six visitor messages are read, in chronological order, with each
bounded to 500 characters. Set `GROQ_SENTIMENT_ENABLED=0` to disable it entirely.
There is no idle-time scheduler: eligibility is reconsidered after the next
successfully generated reply. Short chats can intentionally have no sentiment.

Background processing is registered through Next.js `after`, following durable
completion of the reply. It does not delay the visitor's `[DONE]` signal. It still
shares the route duration limit; analysis is skipped if insufficient time remains.
It remains best-effort rather than a durable job queue.

The shared provider wrapper observes usage in JSON responses and streaming SSE,
accepting both `usage` and Groq's streaming `x_groq.usage` form. Parsing handles
split byte boundaries with bounded buffers. No response clone is drained and no
message text is stored in telemetry. Valid prompt, completion and cached-input
counts are saved once beside the request estimate and a workload label (`chat`,
`scope`, `sentiment`, `demo`, `knowledge_graph`, or `other`). Missing, truncated or
invalid usage stays unmeasured. Telemetry failure cannot break a reply; slot
release falls back to the existing RPC or lease expiry.

Run `npm run report:ai-usage` after deployment to see aggregate last-24-hour usage
per scope, model and workload. It includes total admitted calls, measured calls,
total estimated tokens, estimates for just the measured calls, and actual input,
output and cached-input totals. Compare estimates and actuals only for measured
calls. Missing telemetry is not zero usage. In-flight or legacy calls without a
workload appear as `unreported`. Existing 24-hour request-row retention applies;
this is not a permanent historical dashboard or a billing reconciliation.

Quota admission still uses the original conservative estimates, including the
maximum output allowance. Actual usage is not used to refund provider capacity
yet. This avoids changing protection before real deployment measurements exist.
Provider usage formats were checked against [Groq's SDK schema](https://github.com/groq/groq-typescript/blob/main/src/resources/chat/completions.ts)
and [cache usage documentation](https://console.groq.com/docs/prompt-caching).

## Step 5: read-only capacity monitoring and backup readiness

Apply `20261111040000_add_resilience_snapshot.sql` before deploying. The new
`npm run report:resilience` command and protected `/api/health/resilience` endpoint
check database bytes, Storage metadata totals and missing sizes, AI budgets and
cooldowns, and expired chat reservations. Warnings start at 80%, critical at 95%.
Limits are configurable; database size is not physical disk/WAL usage. The monitor
does not forecast growth, clean up data, or verify hosting/egress quotas.

The existing GitHub monitor can opt in after deployment via repository variable
`PRODUCTION_RESILIENCE_MONITOR_ENABLED=1` and the existing cron secret. The endpoint
requires authorization even in development and returns 503 for warnings/errors.
Neither this setting nor notification delivery has been changed in production.

Backup checking now uses the Management API for the configured project, validates
freshness and completion, and distinguishes an advertised recovery point from
verified recovery. The local read-only check could not verify live backups because
`SUPABASE_ACCESS_TOKEN` was absent. No database export, Storage-file copy, restore
drill or deletion has been performed. The [operations runbook](OPERATIONS_RUNBOOK.md)
documents the free off-site export path and the remaining checks.

## Following steps

1. Use deployment measurements to tune context budgets, evaluate safe usage
   reconciliation and add agent-scoped caching where appropriate.
2. Verify live account limits and backup access, select an off-site backup
   destination, perform an isolated restore drill, and agree retention before cleanup.
3. Evaluate independent model providers and optional customer-owned Groq keys.
   Any key feature needs encrypted server-side storage, tenant isolation,
   validation, revocation, and explicit shared-quota fallback rules.

These changes do not increase free quotas or guarantee 50 simultaneous replies.
Production limits and deployment settings must be checked separately.
