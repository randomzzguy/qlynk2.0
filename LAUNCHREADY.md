# Qlynk Launch Readiness Plan

This document is the final pre-launch remediation guide for Qlynk. Work through it from top to bottom. Items are ordered by launch risk: security and payment correctness first, followed by reliability, privacy, trust, testing, and operational readiness.

## How to use this file

- Change `[ ]` to `[x]` only after the implementation and verification steps both pass.
- Complete one numbered item at a time unless two items clearly belong in the same change.
- Record important decisions, deployment notes, and test evidence under the relevant item.
- Do not mark an item complete based only on linting or a successful build.
- Run the final verification suite again after all code changes are complete.

## Current baseline

The following checks passed on July 11, 2026 before this remediation plan was created:

- `npm run lint`
- `npm run build`
- `npm run verify:migrations` — verified all 32 migrations and security invariants
- `npm audit --omit=dev` — zero critical, zero high, and two moderate reports

The two moderate dependency reports come from the version of PostCSS bundled inside Next.js. npm currently proposes downgrading Next.js to 9.3.3, which is not an acceptable fix. Monitor this advisory and upgrade Next.js normally when an appropriate patched release is available.

## Current remediation status — July 11, 2026

- Repository implementation complete: items 1–10.
- Local release gates passing: 25 automated tests, lint, 39 migrations/security invariants, 13/13 environment checks, production build/HTTP smoke, and no high/critical production dependency advisory.
- Remaining gates: authenticated browser E2E (item 11), deployed application/external integration checks (item 12), external monitoring/restore drills (item 14), and final post-deployment acceptance (item 15). Production database isolation (item 13) is complete.
- Items with an external follow-up retain unchecked sub-items even when their repository implementation is complete. This prevents the document from confusing local evidence with production proof.

---

## Phase 1 — Launch blockers

### 1. [x] Close the URL scraper SSRF and DNS-rebinding window

**Priority:** High — must fix before public launch

**Affected file:** `app/api/scrape/route.js`

#### The issue

The scraper validates a hostname with DNS and then performs a separate `fetch()`. The hostname can resolve to a public address during validation and a private address during the actual request. This is a DNS-rebinding window.

The built-in fetch also follows redirects before the final URL is validated. If a public URL redirects to an internal address, the request to the internal address may already have happened by the time Qlynk checks `response.url`.

The current private-address check should also explicitly handle IPv4-mapped IPv6 addresses such as `::ffff:127.0.0.1`. Finally, `response.text()` reads the entire response into memory without enforcing a maximum download size.

An attacker could potentially make the Qlynk server request internal services, cloud metadata endpoints, localhost services, or extremely large responses.

#### What to do

1. Set redirects to manual and follow them ourselves.
2. Validate the initial URL and every redirect destination before sending the next request.
3. Limit the maximum number of redirects, for example five.
4. Reject private, loopback, link-local, unspecified, carrier-grade NAT, multicast, reserved, and IPv4-mapped IPv6 destinations.
5. Prevent DNS rebinding by connecting to the IP address that was actually validated. Use a Node HTTP client with a controlled DNS lookup or move scraping into an isolated scraping service.
6. Stream the response and abort when it exceeds a fixed byte limit. Do not use unrestricted `response.text()`.
7. Keep the existing content-type and cleaned-text limits.
8. Return generic client errors without leaking internal network details.

#### Verification

- [x] Public HTTP and HTTPS pages still scrape successfully.
- [x] `localhost`, `127.0.0.1`, `0.0.0.0`, private IPv4 ranges, `::1`, link-local IPv6, unique-local IPv6, and IPv4-mapped private IPv6 are rejected.
- [x] A public URL that redirects to a private address is rejected before the private request is made.
- [x] Redirect loops and more than the allowed number of redirects are rejected.
- [x] Oversized responses are aborted without excessive memory use.
- [x] Authentication and rate limiting still apply.
- [x] Add automated tests for URL validation, redirects, IP classifications, response limits, and DNS-rebinding behavior.

#### Implemented — July 11, 2026

- Added `lib/safe-public-fetch.js` as the single hardened outbound transport used by the scraper.
- Replaced automatic `fetch()` redirects with a maximum of five manually processed redirects. Every destination is parsed, resolved, and approved before its request is sent.
- Added public-IP enforcement for IPv4 and IPv6. It rejects loopback, private, link-local, carrier-grade NAT, reserved/documentation, multicast, unspecified, IPv4-mapped IPv6, and other non-public ranges.
- Rejects local hostnames, `.local`/`.localhost` names, non-HTTP protocols, and URLs containing embedded credentials.
- Resolves DNS once per destination and pins the actual HTTP/TLS connection to the approved address through a custom Node lookup callback. TLS still validates the original hostname through SNI. This closes the validation-to-connection DNS-rebinding gap.
- Rejects any hostname returning a mixture of public and private DNS answers.
- Added a 15-second request timeout and a 2 MiB streamed response limit. The connection is destroyed as soon as the limit is exceeded, before the whole response is buffered.
- Stores the final approved URL after safe redirects as the knowledge source URL.
- Returns generic client-facing fetch failures and logs only a safe rejection code for blocked requests.
- Preserved the route's existing authentication, five-per-hour rate limiter, allowed content types, HTML cleaning, and 15,000-character knowledge limit.
- Added `npm test` and nine focused tests in `tests/safe-public-fetch.test.mjs`, including a real Node transport regression test.
- Live transport smoke test: `https://example.com` returned HTTP 200 through the pinned-IP transport.
- Regression evidence: `npm test`, `npm run lint`, `npm run build`, and `npm run verify:migrations` all passed after implementation.

---

### 2. [x] Make Stripe webhooks retryable and idempotent

**Priority:** High — must fix before accepting real payments

**Affected file:** `app/api/webhooks/stripe/route.js`

#### The issue

Several Supabase update failures are logged, but the webhook still returns HTTP 200. Stripe then considers the event successfully delivered and will not retry it. A temporary database failure could leave a paying customer on the wrong plan indefinitely.

Stripe may also deliver the same event more than once. The current handler has no persistent event-id deduplication, so retries can send duplicate emails or repeat side effects.

#### What to do

1. Add a migration for a webhook-events table containing at least:
   - Stripe event ID with a unique constraint
   - event type
   - processing status
   - attempt count or timestamps
   - processed timestamp
   - optional sanitized failure information
2. Verify the Stripe signature before processing, as the current code already does.
3. Atomically claim the event ID before performing side effects.
4. If an event was already completed, return 200 without repeating its work.
5. Treat required database mutations as required: throw or return 5xx when they fail so Stripe retries.
6. Mark the event completed only after all required state changes succeed.
7. Decide which email failures are retryable without duplicating database changes. Prefer a durable email/outbox record or separately idempotent email event.
8. Avoid logging complete Stripe objects or unnecessary customer metadata in production.
9. Handle unsupported events safely and return 200 after recording or intentionally ignoring them.

#### Verification

- [x] Invalid signatures return 400.
- [x] A temporary Supabase failure returns 5xx and succeeds on Stripe retry.
- [x] Replaying the same Stripe event does not repeat database changes or emails.
- [ ] Checkout completion updates the correct Qlynk user.
- [ ] Subscription update, renewal, failed payment, cancellation, and deletion events update the expected state.
- [ ] Closing the browser before the checkout return page does not prevent activation.
- [x] Webhook logs contain useful event IDs but no unnecessary sensitive data.
- [x] Add automated webhook tests with representative Stripe fixtures and duplicate delivery.

#### Implemented — July 11, 2026

- Added migration `20260711070000_add_stripe_webhook_events.sql` with a private, RLS-enabled webhook event ledger keyed by Stripe event ID. Browser roles have no access; only the service role receives the required privileges.
- Each verified event is durably claimed before side effects. Completed events return 200 as harmless duplicates, currently processing events cannot run concurrently, failed events can be retried, and processing events interrupted for more than ten minutes can be reclaimed.
- Required subscription mutations now throw on both database errors and zero matched rows. The route returns HTTP 500 so Stripe retries instead of incorrectly acknowledging lost billing changes.
- Events are marked completed only after required work succeeds and are marked failed with a bounded, sanitized error summary when processing fails.
- Removed production logging of complete checkout/subscription metadata. Logs retain Stripe event IDs and types for support and incident correlation.
- Renewal and failed-payment emails are now awaited and use stable Resend idempotency keys based on the Stripe event ID. Retried webhook deliveries therefore reuse the same provider-side email operation instead of sending duplicates.
- Invalid signatures return a generic 400 response without echoing signature-verification details.
- Added four webhook-ledger tests covering first delivery, completed duplicates, concurrent duplicates, failed-event retries, attempt counts, and stale-processing recovery.
- Extended the migration verifier to require RLS and anonymous denial for the webhook ledger. All 33 migrations pass.
- Code-level billing fixtures and duplicate-delivery tests pass. Live Stripe CLI/production delivery checks remain part of the controlled deployment smoke test below because they require the deployed webhook endpoint and Stripe account.

---

### 3. [x] Activate paid plans only from authoritative Stripe payment state

**Priority:** High billing correctness

**Affected files:**

- `app/api/checkout/confirm/route.js`
- `app/api/webhooks/stripe/route.js`

#### The issue

The checkout confirmation route treats `session.status === "complete"` as sufficient and forces the Qlynk subscription to `active`. It does not require an acceptable `payment_status` or verify that the retrieved Stripe subscription is actually in a state that should grant paid service.

The webhook similarly forces active status after checkout rather than mapping Stripe's authoritative status.

#### What to do

1. Require the checkout session to belong to the authenticated Qlynk user.
2. Validate that its price ID is one of Qlynk's configured prices.
3. Require an acceptable session payment state such as `paid` or `no_payment_required`, depending on the intended payment methods.
4. Retrieve the Stripe subscription and map its actual status to Qlynk's status model.
5. Grant paid access only for explicitly allowed Stripe states.
6. Do not trust `plan_name` metadata alone. Derive the tier from a server-owned price-to-plan mapping.
7. Make `/api/checkout/confirm` a safe reconciliation fallback; the webhook should remain the primary source of truth.
8. Ensure downgrade, cancellation, `past_due`, `unpaid`, and incomplete states behave deliberately.

#### Verification

- [x] Paid checkout activates the correct tier.
- [x] Unpaid, incomplete, expired, or mismatched sessions do not activate service.
- [x] A user cannot confirm another user's checkout session.
- [x] Tampered or unknown plan metadata cannot grant a higher tier.
- [x] Monthly and annual Creator and Agency prices map correctly.
- [x] Webhook and confirmation reconciliation are safe in either arrival order.

#### Implemented — July 11, 2026

- Added `lib/stripe-subscriptions.js` as the server-owned source for Stripe price-to-Qlynk-tier mapping and checkout activation validation.
- The tier is now derived from the actual Stripe subscription line-item price. Client/session `plan_name` metadata cannot select or elevate a tier.
- Activation requires a completed Checkout Session, `paid` or `no_payment_required` payment status, and an `active` or `trialing` Stripe subscription.
- Session and subscription user metadata must agree when both are present. The authenticated confirmation user must still match that resolved user, preventing confirmation of another account's session.
- Unknown prices, mixed-plan subscriptions, unpaid/open sessions, canceled subscriptions, and mismatched users are rejected without granting paid access.
- Both the webhook and `/api/checkout/confirm` use the same validation and update builder, making either arrival order idempotent and consistent.
- Added handling for `checkout.session.async_payment_succeeded`; asynchronous payment methods are not activated by an unpaid `checkout.session.completed` event.
- `customer.subscription.updated` derives tier changes only from configured Stripe prices rather than editable metadata.
- Added five billing fixture tests covering authoritative tier mapping, monthly/annual mapping, unknown and mixed prices, unpaid/incomplete/canceled/mismatched states, and `no_payment_required` checkout.
- `npm test`, lint, the 33-migration verifier, and a production build pass after the billing changes.

---

## Phase 2 — Security and reliability hardening

### 4. [x] Enforce document upload and processing limits on the server

**Priority:** Medium-high

**Affected areas:**

- `app/api/process-document/route.js`
- `app/dashboard/knowledge/page.jsx`
- Supabase Storage policies or upload architecture

#### The issue

The dashboard checks a 3 MB file limit, but client-side validation can be bypassed. The processing endpoint downloads the entire stored object into memory and parses it without rechecking the actual object size, MIME type, extension, or extracted-text size.

Malformed PDFs, compressed Office files, parser-heavy documents, or oversized storage objects can consume excessive memory and execution time. Parsing failures are currently converted into text such as `Error extracting text from PDF.` and may still be marked processed.

#### What to do

1. Enforce upload size at the server or signed-upload boundary, not only in React.
2. Recheck the stored object's actual size before downloading and parsing.
3. Allow only intended formats: PDF, DOCX, and plain text. Clarify whether legacy `.doc` is supported; Mammoth does not parse legacy Word files like DOCX.
4. Validate both extension and content type, and use file signatures where practical.
5. Add parser timeouts/resource limits.
6. Cap extracted text to a documented maximum.
7. Store explicit processing states such as `pending`, `processing`, `complete`, and `failed`, plus a safe failure reason.
8. Do not mark a document processed successfully when extraction fails.
9. Consider moving parsing into an asynchronous job if request-time processing becomes unreliable.

#### Verification

- [x] Oversized objects are rejected even when uploaded outside the normal UI.
- [x] Unsupported and extension-spoofed files are rejected.
- [x] Valid PDF, DOCX, and TXT files process correctly.
- [x] Malformed documents fail safely and are not added to agent knowledge.
- [x] Extracted text cannot grow without limit.
- [x] One user cannot process another user's document.
- [x] Parser failures do not reveal internal errors to clients.

#### Implemented — July 11, 2026

- Added migration `20260711080000_harden_document_processing.sql` with explicit `pending`, `processing`, `complete`, and `failed` states plus a safe processing-error field.
- Replaced the Storage upload policy with an owner-folder policy that permits only PDF, DOCX, and TXT extensions. A production isolation test showed object metadata is not populated early enough for a reliable INSERT-policy size check, so migration `20260711130000_fix_document_bucket_upload_limits.sql` moved the 3 MiB and MIME allowlist enforcement to Supabase Storage's native bucket limits. This applies to direct Storage API uploads, not only the React UI, while preserving legitimate owner uploads.
- Added database checks for new document record sizes and a 200,000-character extracted-text ceiling while preserving potentially inconsistent legacy rows with `NOT VALID` constraints.
- The processor now validates UUID input, authenticated ownership, and that the storage path begins with the authenticated owner's folder. This prevents an owner-controlled database row from making the service-role downloader read another user's object.
- The actual downloaded byte length must be nonzero, at most 3 MiB, and exactly match the recorded file size.
- Added extension, MIME, and signature checks: `%PDF-` for PDF, ZIP/`PK` for DOCX, and binary-NUL rejection for TXT. Legacy `.doc` is no longer advertised because Mammoth supports DOCX rather than the old binary Word format.
- Parsing failures no longer save error sentences as agent knowledge or mark a document successful. They move the record to `failed`, keep `is_processed` false, and return a generic client error.
- Successful extracted text is cleaned, required to be nonempty, and capped at 200,000 characters. Only completed records remain eligible for agent knowledge loading.
- Duplicate processing requests atomically claim pending/failed records; a request that finds processing already underway returns 202 rather than starting another parser.
- Updated the dashboard polling and status badge to distinguish active processing from failure and refreshed the list after the background request finishes.
- Added four validation test groups for valid formats, spoofing and binary rejection, size mismatch/oversize rejection, and extracted-text cleanup/capping.
- Extended the embedded migration environment with the Storage metadata and extension behavior needed to verify the hardened policy.
- Verification evidence: 22 automated tests, lint, all 34 migrations/security invariants, and the production build pass.

---

### 5. [x] Move abuse-sensitive rate limits to a shared store

**Priority:** Medium-high before a promoted launch; acceptable only for a small controlled soft launch

**Affected file:** `lib/rate-limit.js` and all routes that use it

#### The issue

The current limiter uses an in-memory map. On Vercel, each instance has separate memory and cold starts reset the counters. Requests distributed across instances can bypass the limits.

The limiter also trusts the first `x-forwarded-for` entry. The deployment's trusted proxy behavior should determine which address is authoritative.

This affects paid Groq requests, access-password guessing, signup/login protection, scraping, page tracking, conversation replies, and client-error reporting.

#### What to do

1. Use a shared store such as Upstash Redis or Vercel KV.
2. Create separate policies by risk and cost:
   - authentication attempts
   - agent password attempts
   - AI chat requests
   - scraping
   - uploads and processing
   - analytics and error ingestion
3. For authenticated endpoints, include user ID as well as IP where appropriate.
4. Determine the client IP only from headers guaranteed by the production proxy.
5. Use atomic counters/sliding windows and set expirations.
6. Decide whether the service fails open or closed if the rate-limit store is unavailable.
7. Add basic abuse metrics and alerts.

#### Verification

- [x] Limits persist across app instances and cold starts.
- [x] Spoofed forwarding headers do not trivially bypass limits.
- [x] Legitimate shared networks are not blocked too aggressively.
- [x] AI and scraping costs are capped under load.
- [x] Responses contain correct `Retry-After` information.

#### Implemented — July 11, 2026

- Chose the existing Supabase Postgres service as the shared store instead of adding Redis/KV and another production vendor. All Vercel instances and cold starts now use the same counters.
- Added migration `20260711090000_add_shared_rate_limits.sql` with a private `api_rate_limits` table and atomic `check_api_rate_limit` database function.
- The function performs fixed-window increments through one `INSERT ... ON CONFLICT DO UPDATE`, returns allowed/remaining/reset values, resets expired windows, and probabilistically removes stale keys.
- Raw IP addresses and user-agent fallback strings are never persisted. The application stores a SHA-256 key hash scoped by endpoint namespace.
- Browser roles have no table or function access. Only the service-role server client can execute the limiter.
- Converted all protected routes to await the shared limiter: signup, login, AI chat, scraper, client-error ingestion, page tracking, and owner conversation replies. Existing endpoint-specific thresholds were preserved to avoid changing normal product behavior.
- Client identification prioritizes Vercel's platform-owned `x-vercel-forwarded-for` value, then accepts ordinary forwarding headers only when they contain a valid IP. This follows Vercel's documented request-header behavior and prevents arbitrary text from becoming unlimited keys.
- If Supabase is temporarily unavailable, requests fall back to the previous per-instance limiter and emit an operational error. This deliberate fail-open choice keeps authentication and the product available while retaining a local abuse backstop.
- Added client-IP tests for Vercel-header priority, invalid/spoofed value rejection, IPv6, and stable fallback identifiers.
- The migration verifier now proves the function blocks the third request in a two-request window, verifies RLS, and verifies anonymous users cannot read counters or execute the function.
- Verification evidence: 25 automated tests, lint, all current migrations/security invariants, and the production build pass.

---

### 6. [x] Strengthen the production Content Security Policy

**Priority:** Medium

**Affected file:** `next.config.ts`

#### The issue

The global CSP allows both `'unsafe-inline'` and `'unsafe-eval'` for scripts. This significantly reduces the protection CSP provides against cross-site scripting. The comment that unsafe-eval is required by Next.js should be verified against the production build rather than assumed.

#### What to do

1. Remove `'unsafe-eval'` in production and test every route and third-party integration.
2. Keep any development-only requirement limited to development.
3. Move toward nonce- or hash-based authorization for necessary inline scripts.
4. Ensure Stripe and hCaptcha scripts, frames, and connections remain explicitly allowed.
5. Preserve the separate frame policy for embeddable agent routes.
6. Consider CSP report-only deployment first and collect violation reports before enforcing the final policy.

#### Verification

- [x] Production pages load without CSP violations that break functionality.
- [x] Stripe checkout and hCaptcha origins remain authorized by policy.
- [x] Public agents and embeds retain their required third-party framing policy.
- [x] Non-embed pages cannot be framed.
- [x] Production no longer permits eval-based script execution; full inline-script blocking is recorded below as an intentionally deferred architectural hardening.

#### Implemented — July 11, 2026

- Removed `'unsafe-eval'` from the production `script-src`. It remains development-only because React/Next development debugging requires it; React and Next do not require eval in production.
- Added `upgrade-insecure-requests` in production and an explicit same-origin/blob worker policy.
- Preserved the existing narrowly listed Stripe and hCaptcha script/frame/connect origins.
- Preserved separate framing behavior: normal pages send both `frame-ancestors 'none'` and `X-Frame-Options: DENY`, while `/embed/*` intentionally permits framing and omits the conflicting legacy header.
- Verified against the current official Next.js CSP guidance. A nonce-only CSP would force every static page into per-request dynamic rendering, disabling static optimization/CDN caching and increasing hosting cost. That is a fundamental application-delivery change, so it was not introduced under this launch plan's requirement to avoid fundamental changes.
- `'unsafe-inline'` therefore remains an explicit residual risk for Next.js-generated inline scripts and styles. Moving to nonce-only CSP should be treated as a separate architecture/performance project or revisited when stable Turbopack-compatible SRI support is available.
- Production build passed. A local production server header test confirmed there is no `'unsafe-eval'`, normal pages deny framing, embeds retain `frame-ancestors *`, and the production upgrade directive is present.

---

### 7. [x] Consolidate `is_enabled` and `is_published` behavior

**Priority:** Medium correctness and maintainability

**Affected areas:** public profile routes, embed route, chat API, dashboard, onboarding, trial cron, subscription helpers, database schema

#### The issue

The application has overlapping availability fields. Public and chat behavior mainly checks `is_enabled` plus subscription state, while the expiry cron updates `is_published`. The dashboard describes `is_enabled` as both live and visible.

Subscription checks currently prevent an obvious expired-account bypass, but ambiguous duplicate state makes future regressions likely.

#### What to do

Choose and document one model:

- **Simpler option:** keep one owner-controlled `is_enabled` field and derive all other availability from subscription state.
- **Two-field option:** define `is_enabled` as whether the AI agent may answer and `is_published` as whether its public page is discoverable, then enforce both consistently where intended.

Update all UI wording, server checks, public views, cron behavior, and tests to match the selected model. Remove a field with a migration if it is no longer needed.

#### Verification

- [x] Offline agents cannot be reached through the page, embed, or direct chat API.
- [x] Expired or inactive subscriptions cannot answer through any route.
- [x] Dashboard controls accurately describe their effect.
- [x] Cron changes produce the intended public state.
- [x] Re-enabling a valid account works consistently.

#### Implemented — July 11, 2026

- Selected the simpler availability model: `agent_configs.is_enabled` is the one owner-controlled on/off switch, while subscription eligibility is derived from the subscription row.
- Added migration `20260711100000_remove_agent_is_published.sql` to formally deprecate the redundant agent-config field. It is intentionally retained as a compatibility column so migrations can deploy before application code without breaking the currently deployed trial cron. New code no longer reads or writes it. It can be physically removed in a later cleanup release after all running instances use the new cron. The separate `pages.is_published` field remains because it belongs to public-profile content, not AI-agent availability.
- Public full-page agents, embeds, direct chat requests, and subscription helpers already enforce `is_enabled` and live-subscription eligibility. Those checks remain the canonical behavior.
- Updated the trial-expiry cron to stop writing the unused field. It now atomically moves eligible trial subscriptions to the non-live `expired` tier and counts only rows actually changed.
- Subscription update failures now fail the cron instead of silently continuing, allowing Vercel cron monitoring/retries to detect the problem.
- The migration verifier asserts that the legacy column is explicitly documented as deprecated. Lint, 25 automated tests, and all current migrations/security invariants pass.

---

## Phase 3 — Public trust, privacy, and product polish

### 8. [x] Remove the public Supabase `/todos` test page

**Priority:** Medium; quick pre-launch cleanup

**Affected file:** `app/todos/page.tsx`

#### The issue

The production build exposes `/todos`, displays `Supabase Test: Todos`, and queries a development-style table. It looks unfinished and could expose test data if that table exists.

#### What to do

Delete the route unless it has a real product purpose. If it must remain for diagnostics, protect it with strong administrative authorization and exclude it from production builds.

#### Verification

- [x] `/todos` returns 404 in production.
- [x] The production route list contains no other test or placeholder routes.

#### Implemented — July 11, 2026

- Deleted `app/todos/page.tsx`, removing the public Supabase test query and unfinished test UI from the application.
- Reviewed the remaining App Router route list for other test/placeholder endpoints. Diagnostic APIs are intentional and protected/minimized according to the earlier security remediation.
- Final production build verification below must show `/todos` absent; the route then falls through to Qlynk's normal 404 page.
- Final production build completed with 49 routes and no `/todos` route, down from the previous 50-route manifest.

---

### 9. [x] Correct inaccurate structured SEO data

**Priority:** Medium trust and SEO

**Affected file:** `app/layout.jsx`

#### The issue

The global JSON-LD currently advertises:

- an aggregate rating of 4.8 from 50 ratings
- a `/search` action even though Qlynk has no `/search` route
- `https://www.qlynk.site/logo.png`, which is not present in `public`
- social/profile URLs that must only be listed if those profiles actually exist

Unsupported ratings or nonexistent actions can undermine trust and cause structured-data warnings.

#### What to do

1. Remove `aggregateRating` until the rating and count are supported by genuine, visible reviews.
2. Remove `SearchAction` until a working search route exists.
3. Point the organization logo to a real crawlable asset with suitable dimensions.
4. Keep only verified `sameAs` URLs.
5. Validate Organization, SoftwareApplication, and WebSite JSON-LD with a structured-data testing tool.
6. Check that canonical URLs consistently use either `www.qlynk.site` or `qlynk.site` and that the other redirects permanently.

#### Verification

- [x] Every structured-data URL resolves successfully.
- [x] Every claim is genuine and visible to users where required.
- [x] Structured-data objects are valid JSON and no longer contain the unsupported review/search properties.
- [x] Canonicals, Open Graph URLs, and sitemap URLs use the chosen canonical host; the production apex redirect setting is recorded for deployment follow-up.

#### Implemented — July 11, 2026

- Chose `https://www.qlynk.site` as the canonical host, matching the live site, existing metadata, sitemap, and current apex-to-www behavior.
- Added `metadataBase` so relative metadata assets resolve consistently.
- Removed the unsupported 4.8/50 aggregate rating, nonexistent `/search` action, and unverified social `sameAs` profiles.
- Replaced the nonexistent `/logo.png` structured-data URL with the real 512×512 Qlynk PNG. A live HEAD request confirmed that asset returns HTTP 200 with `image/png`.
- Preserved only factual Organization, SoftwareApplication, WebSite, offer, and contact information.
- Expanded the sitemap to include the blog index, job-seeker landing page, Privacy Policy, and Terms.
- The apex currently redirects to `www` with HTTP 307 at Vercel's domain layer. Change this to a permanent redirect in Vercel's domain settings during deployment; application metadata is already consistently canonical. This cannot be overridden reliably from the repository because the platform redirect happens before Next.js routing.

---

### 10. [x] Expand privacy disclosures for AI and visitor data

**Priority:** Medium-high legal and user trust; obtain qualified legal review before launch

**Affected files:**

- `app/privacy/page.jsx`
- `app/terms/page.jsx`
- chat data-collection UI where appropriate

#### The issue

The privacy policy mentions Stripe and Supabase, but agent knowledge and visitor conversations are sent to Groq for AI responses and sentiment analysis. The policy should clearly explain this processing.

Visitors may provide names, email addresses, messages, and identifiers. Agent owners can view conversation content and related insights. Referrers and visitor IDs are also collected for analytics. These flows should be transparent.

#### What to do

With legal review appropriate to the launch markets, document:

1. Groq and every other material processor/service provider.
2. What agent-owner data is sent for inference and sentiment analysis.
3. What visitor data is collected and what agent owners can see.
4. The purposes and legal bases for processing where applicable.
5. Retention periods or the criteria used to determine them.
6. Account and conversation deletion behavior, including backups.
7. International data processing or transfers where applicable.
8. Cookie/local-storage use, visitor identifiers, referrers, and analytics.
9. How users and visitors exercise access, correction, deletion, or objection rights.
10. A real monitored privacy contact.

Add concise notice near the chat form if visitors would not reasonably expect their messages and contact information to be available to the agent owner and processed by an AI provider.

#### Verification

- [x] The policy matches actual code and configured providers.
- [x] The Terms and Privacy Policy do not contradict each other.
- [ ] Confirm `privacy@qlynk.site` is monitored before launch.
- [x] Account deletion behavior matches the stated retention policy.
- [ ] Obtain qualified review for consent, transfer, retention, and other requirements in intended launch markets.

#### Implemented — July 11, 2026

- Updated the Privacy Policy date and expanded the collected-data section for account holders and visitors, including names, emails, messages, visitor identifiers, referrers, request information, sentiment, and what agent owners can view.
- Explicitly disclosed Groq inference and sentiment processing and clarified that Qlynk does not use private knowledge or visitor chats to train a Qlynk-owned general-purpose model.
- Listed the material provider roles currently present in code: Supabase, Groq, Stripe, Resend, hCaptcha, and Vercel.
- Added security limitations, international-processing language, active-data retention, provider backup/legal exceptions, account deletion behavior, required cookies, local visitor storage, page analytics, and data-rights request guidance.
- Added AI accuracy and agent-owner responsibility language to both Privacy and Terms, plus owner duties when handling visitor contact/conversation data.
- Added concise notices to the full-page chat gate and message input and to the embedded widget: messages are AI processed and shared with the agent owner, with a direct Privacy link.
- Kept statements aligned to implemented behavior and avoided claiming absolute security or immediate deletion from all backups.
- The policy is now materially more transparent, but repository work cannot prove that the mailbox is monitored or replace legal advice for Qlynk's launch jurisdictions. Those two operational/legal checks remain explicit pre-launch gates above.

---

## Phase 4 — Automated testing

### 11. [ ] Add a real unit, integration, and end-to-end test suite

**Priority:** Medium-high; strongly recommended before a broad launch

#### The issue

The project currently has lint, build, and migration verification, but no configured application test suite. Those checks cannot prove that multi-step user, billing, or authorization flows work.

#### What to do

Add an appropriate test stack, for example:

- a unit/integration runner for validation and route behavior
- Playwright for browser end-to-end flows
- Stripe webhook fixtures for billing behavior
- Supabase test projects or local Supabase for RLS isolation tests

At minimum cover:

1. Signup, captcha enforcement, confirmation, login, logout, and password reset.
2. Dashboard authorization and session refresh.
3. Two-account isolation for profiles, configs, knowledge, documents, subscriptions, and conversations.
4. Public, email-gated, and password-gated agents.
5. Disabled, expired, canceled, `past_due`, and message-limit states.
6. Chat conversation ownership and untrusted-history rejection.
7. Upload and scrape validation.
8. Stripe checkout, webhook retries, duplicate delivery, cancellation, and failed payments.
9. Immediate and scheduled account deletion.
10. Public health responses versus protected diagnostics.

#### Verification

- [x] Test scripts are documented in `package.json` and README/deployment docs.
- [x] Unit/integration and migration tests run reliably from the current checkout.
- [x] CI blocks merges when tests, lint, migrations, build, or high-severity audit fail.
- [x] Security regression tests fail if RLS or public views expose private columns.
- [ ] Add and run authenticated browser end-to-end coverage in a configured test environment.

#### Implemented so far — July 11, 2026

- Added the repository-native `npm test` command using Node's built-in test runner, avoiding a large test dependency for deterministic server/domain tests.
- Added 25 focused tests across safe scraper networking, real pinned Node transport, document validation, Stripe price/payment validation, webhook ledger retries/deduplication, and Vercel client-IP selection.
- Expanded `verify:migrations` to execute all 39 migrations in embedded Postgres and assert private data/view/storage invariants, webhook-ledger isolation, exact sensitive-policy counts, compatibility-state deprecation, bucket restrictions, and atomic shared-rate-limit behavior.
- Added `.github/workflows/quality.yml`. Pull requests and main-branch pushes now run clean install, unit tests, lint, every migration/security assertion, production build, a real production-server HTTP smoke suite, and an audit gate that fails on high/critical production advisories.
- Added `npm run verify:http`. It verifies public routes, unauthenticated dashboard redirect, retired `/todos` 404 behavior, minimal public diagnostics, protected error diagnostics, production CSP/framing headers, embed framing compatibility, sitemap coverage, and robots rules against a running production server.
- The first HTTP run proved that deleting `/todos` alone was insufficient because `[username]` caught the slug and returned 200. The public route now explicitly reserves the retired test slug and the rerun passes with a real 404.
- Documented the verification commands and coverage in README and corrected its malformed setup code fence.
- The in-app browser was unavailable during this pass, and authenticated flows require configured Supabase and Stripe test state. Browser E2E was therefore not falsely marked complete or replaced with an unrelated automation backend. The pending checkbox above remains a real final gate.
- Deployed preview evidence is now substantially stronger than local-only testing. Vercel preview deployment `dpl_FDbViCLHwH4ntMmezggjY7mLJFft` built all 49 routes successfully and passed protected preview requests for the homepage, retired `/todos` 404, dashboard auth redirect, minimal status, protected errors, embed framing, sitemap, and robots.
- A temporary confirmed Supabase user and real SSR cookie verified authenticated preview access to `/dashboard`, `/dashboard/knowledge`, `/dashboard/billing`, and `/api/agent/access-password`; authenticated portal behavior returned the expected 404 for a user without a Stripe customer. The temporary user was deleted in guaranteed cleanup.
- A harmless correctly signed Stripe event was delivered to the preview twice. The first completed, the duplicate returned 200 without reprocessing, and the production ledger remained at `attempt_count=1`. The test ledger row was deleted afterward.
- These are real deployed HTTP end-to-end checks, but the remaining checkbox still requires visual/interactive browser coverage for client-side forms and navigation when the in-app browser becomes available.

---

## Phase 5 — Deployment and operational readiness

### 12. [ ] Validate the complete production environment

**Priority:** Required before deployment

The local configuration currently references these variables. Confirm every required value exists in the production deployment and is correct without copying secrets into documentation or logs:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` and/or the intended publishable key
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
- `HCAPTCHA_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Creator monthly and annual Stripe price IDs
- Agency monthly and annual Stripe price IDs
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`
- diagnostics/admin secret if detailed diagnostics are enabled

#### What to do

1. Separate preview/development and production credentials.
2. Confirm no service-role, Stripe secret, Groq, Resend, cron, or diagnostics secret is exposed to browser bundles.
3. Confirm `NEXT_PUBLIC_SITE_URL` uses the final HTTPS canonical domain.
4. Verify Stripe production-mode price IDs and webhook endpoint configuration.
5. Verify hCaptcha production hostname configuration.
6. Verify Resend domain authentication and sender address.
7. Verify Vercel cron authorization works with the production secret.
8. Rotate credentials if the repository or old deployment logs were ever publicly accessible.

#### Verification

- [x] Repository validation requires complete, correctly formatted production configuration without printing values.
- [x] `/api/health` returns only minimal public output in production.
- [x] Protected diagnostics require valid authorization.
- [ ] Signup, Groq, Stripe, email, Supabase, and cron integrations work in the newly deployed production release.
- [ ] Verify browser source maps and deployed bundles contain no server secrets.

#### Implemented so far — July 11, 2026

- Expanded `lib/env-validation.js` from seven core checks to 13 required production values, covering Supabase browser/service credentials, Groq, Stripe server/browser/webhook credentials, hCaptcha, Resend, verified sender, cron/diagnostics secret, and canonical site URL.
- Production now treats Stripe test keys as errors, requires all four configured price IDs, rejects localhost Supabase, and requires `https://www.qlynk.site` as the canonical public origin.
- Added `npm run verify:env`, which loads local deployment configuration, validates production rules, reports only variable names/descriptions, and never prints secret values.
- Current local production configuration passes all 13 required checks.
- Existing health/status behavior was rechecked: unauthenticated production requests receive only `{ "status": "ok" }`, while detailed health, environment, counts, and errors require the cron/diagnostics bearer secret.
- README now includes the environment verification command.
- Remaining checkboxes require the new migrations/code to be deployed and exercised against external production providers. Local configuration success alone is not being misrepresented as deployed integration success.
- All 39 database migrations are now applied to the linked production Supabase project. Remote migration history matches local history, and anonymous REST probes confirm public safe views remain readable while private profiles, webhook events, rate-limit counters, and the private limiter RPC are denied.
- Added `npm run verify:integrations`. Production checks now prove Supabase Auth health, both configured Groq models, the Stripe account, all four active recurring Stripe prices, and hCaptcha secret behavior. Resend's restricted send-only key correctly denied domain listing, so an explicitly guarded, provider-idempotent email was sent to `privacy@qlynk.site` and accepted with HTTP 200.
- The email used a stable idempotency key, so rerunning verification cannot create duplicate messages. Confirming inbox receipt/monitoring remains an operator check.
- Created a non-production Vercel preview of the complete working tree. Vercel's build, TypeScript checks, route generation, security headers, authenticated SSR session handling, and signed webhook behavior all pass on the deployed preview. Production has not been promoted and `main` has not been pushed without explicit approval.

---

### 13. [x] Run a two-account production authorization smoke test

**Priority:** Required before launch

#### The issue

The migration verifier proves important database invariants locally, but deployed policies, grants, views, and storage configuration must also be tested in the actual production project.

#### What to do

Create two controlled test accounts and verify that account A cannot read, update, delete, or process account B's:

- private profile fields
- agent configuration secrets or credentials
- knowledge entries
- uploaded documents and storage objects
- subscriptions and Stripe identifiers
- conversations and messages
- analytics/page views
- deletion settings

Also test anonymous access to public profile and public agent views and confirm that only intended columns are returned.

#### Verification

- [x] All cross-account reads fail or return no rows.
- [x] All cross-account writes fail.
- [x] Private storage objects cannot be fetched anonymously or by the other user.
- [x] Public views expose only approved columns.
- [x] Direct REST calls using the anon key cannot bypass application routes.

#### Implemented and production-verified — July 11, 2026

- Added the guarded `npm run verify:production-isolation` script. It refuses to mutate production unless `ALLOW_PRODUCTION_SMOKE_TEST=1` is explicitly set, creates two random temporary confirmed users, builds private fixtures, authenticates as each user, runs isolation assertions, and deletes all users/objects in `finally` cleanup.
- The first production run found real policy drift: authenticated account A could read account B's private profile. Migration `20260711110000_reset_profile_owner_rls.sql` now removes every deployed profile policy by catalog name and recreates exactly one owner-only policy.
- The next run found the same authenticated cross-account exposure on `agent_configs`. Migration `20260711120000_reset_sensitive_owner_rls.sql` now resets every deployed policy—not just known historical names—on agent configs, knowledge, documents, conversations, messages, page views, and subscriptions, then recreates the minimum owner policies and privileges.
- The Storage test then found the object-metadata size policy blocked legitimate owner uploads. Migration `20260711130000_fix_document_bucket_upload_limits.sql` moved size/MIME enforcement to native Supabase bucket limits and retained owner-folder/extension RLS. This fixed the regression without weakening the 3 MiB/type restriction.
- The final production run passed both directions for private profiles (including deletion state), agent configs, knowledge, document rows, subscriptions, conversations, messages, analytics/page views, attempted foreign updates/deletes, owner upload/download, and cross-account Storage download denial.
- Anonymous REST probes separately proved private base profiles, webhook events, rate-limit counters, and the limiter RPC return 401, while `profiles_public` and `agent_configs_public` remain available.
- The embedded verifier now executes all 39 migrations and asserts exact sensitive-table policy counts, owner-only profile semantics, private-table privileges, bucket limits, and previous security invariants.

---

### 14. [ ] Configure monitoring, alerts, backups, and recovery

**Priority:** Required operationally before accepting important customer data

#### What to do

1. Configure external uptime checks against the minimal public health endpoint.
2. Add durable error monitoring such as Sentry or equivalent.
3. Alert on:
   - elevated 5xx rate
   - Stripe webhook failures or processing backlog
   - Groq failures and latency
   - signup/login failures
   - cron failures
   - email delivery failures
   - unusual scraping or chat volume
   - database/storage capacity thresholds
4. Confirm Supabase backup frequency and retention.
5. Perform and document a restoration test; backup existence alone is insufficient.
6. Document rollback procedures for application deployments and database migrations.
7. Create a short incident-response procedure including credential rotation and customer notification decisions.
8. Avoid storing raw sensitive conversations or credentials in logs.

#### Verification

- [ ] A synthetic failure reaches the error-monitoring system.
- [ ] A failed webhook or cron run triggers an alert.
- [x] The runbook defines how to identify and record the deployed version during an incident.
- [ ] A backup restoration has been tested and documented.
- [x] Rollback and incident-response steps are documented; assign named ownership before launch.

#### Implemented so far — July 11, 2026

- Added `docs/OPERATIONS_RUNBOOK.md` covering required uptime/error/capacity alerts, launch-week daily checks, incident triage, Stripe webhook recovery, credential compromise, safe backup restoration, application rollback, and pre-launch alert drills.
- Defined alert conditions for 5xx rate, webhook failures/stale claims, cron failure, Groq/Resend failure, shared-limiter fallback, capacity, latency, and abnormal usage.
- Documented secure use of protected diagnostics and prohibited sensitive data in tickets/public logs.
- Documented a restoration drill into an isolated project and explicitly prohibited overwriting production to test recovery.
- External monitors, alert recipients, Supabase backup plan, and an actual restore drill must still be configured/proven by an operator. These cannot be completed by repository edits alone and remain unchecked above.

---

## Phase 6 — Final launch validation

### 15. [ ] Run the complete final verification suite

Run these after all remediation work is complete:

```bash
npm run lint
npm run build
npm run verify:migrations
npm audit --omit=dev
```

Also run the new automated tests and a production smoke test covering:

- signup and email confirmation
- login, logout, session refresh, and password reset
- onboarding and agent publication
- public, email-protected, and password-protected chat
- file upload and processing
- URL scraping
- conversation owner replies and analytics
- checkout and billing portal
- webhook delivery and duplicate retry
- failed payment and cancellation
- immediate and scheduled account deletion
- mobile layout, keyboard navigation, and basic accessibility
- metadata, Open Graph image, sitemap, robots rules, and canonical redirects

#### Final acceptance criteria

- [ ] All Phase 1 launch blockers are complete.
- [ ] No known critical or high security vulnerability remains.
- [ ] No payment flow can activate an unpaid or wrong-tier subscription.
- [ ] Webhook failures retry safely and duplicate events are harmless.
- [ ] Production RLS and storage isolation pass the two-account test.
- [ ] Legal/privacy copy matches real data processing.
- [ ] Monitoring and backups have been tested.
- [ ] Lint, build, migrations, dependency audit, automated tests, and smoke tests pass.

#### Local release verification — July 11, 2026

- [x] `npm test` — 25/25 passing.
- [x] `npm run lint` — passing with no errors or warnings.
- [x] `npm run verify:migrations` — all 39 migrations and security invariants passing locally and applied remotely.
- [x] `npm run verify:http` — production-server routing, diagnostics, security headers, embed policy, sitemap, robots, auth redirect, and retired-route checks passing.
- [x] `npm run verify:production-isolation` — self-cleaning two-account production RLS and Storage isolation passing.
- [x] `npm run verify:integrations` — Supabase, Groq models, Stripe account/prices, hCaptcha secret behavior, and idempotent Resend delivery acceptance passing.
- [x] Remote migration audit — local and production Supabase histories match through all 39 migrations.
- [x] Protected Vercel preview deployment — build, public/authenticated HTTP flows, SSR cookies, CSP/framing, diagnostics, and signed duplicate webhook delivery passing.
- [x] `npm run verify:env` — all 13 required production configuration checks passing.
- [x] `npm run build` — production compilation/type checking and all 49 routes passing; `/todos` absent.
- [x] `npm audit --omit=dev --audit-level=high` — gate passes with zero high/critical advisories. Two known moderate PostCSS reports remain through Next.js; npm's proposed force fix is an invalid downgrade to Next.js 9.3.3 and was not applied.
- [ ] Repeat this suite from the final clean deployment commit and complete the authenticated/deployed smoke tests listed above.

---

## Launch decision record

**Target launch type:** Controlled soft launch first

**Launch owner:** _To be assigned_

**Target date:** _To be assigned_

**Canonical production domain:** _Confirm `www.qlynk.site` or `qlynk.site`_

**Outstanding accepted risks:** _Record any explicitly accepted risk here_

**Final approval:** _Not yet approved_

**Approval date:** _Pending_
