# Qlynk Security & Quality Audit — Fix Tracker

This document captures findings from a full codebase review of Qlynk (Next.js + Supabase + Groq AI). Items are ordered by severity. Each entry explains **what the issue is**, **where it lives**, **why it matters**, and **what to do about it**.

Use this as a remediation checklist. Tackle **Critical** items first.

## Codex verification update — July 11, 2026

The repository audit has been verified against the current code and migrations.

- **Implemented in the working tree:** #1–#23 and #25–#28.
- **Production database remediation deployed and smoke-tested:** #1, #2, #7, #13, #15, #16, #20, #21, and #23.
- **Operational follow-up:** #6 still requires reviewing access logs and rotating credentials if the repository was ever public; repository metadata is now removed and ignored.
- **Accepted launch limitation:** #24 remains an in-memory limiter. Moving it to shared Redis/KV is intentionally deferred until multi-instance scaling or observed abuse, as the original audit permits.
- **Verification completed:** repository-wide ESLint, repeated production builds, local production HTTP checks, and `npm run verify:migrations`. The embedded Postgres verifier executes all 32 migrations and asserts bcrypt conversion, RLS, safe-view columns, storage privacy, subscription privileges, and rejection of anonymous tracking writes.
- **Dependency hardening discovered during verification:** upgraded Next.js to 16.2.10, Supabase JS to 2.110.2, Supabase SSR to 0.5.2, and PostCSS to 8.5.16. A non-forced `npm audit fix` leaves two moderate reports caused by Next.js bundling an older internal PostCSS; npm's proposed forced fix incorrectly downgrades Next.js to 9.3.3, so it was not applied.

The production migrations were deployed on July 11, 2026. Post-deployment anonymous REST probes confirm that direct access to `agent_configs`, subscriptions, private profile fields, and knowledge rows is blocked or returns no rows, while the restricted `agent_configs_public` and `profiles_public` views remain available. A follow-up defense-in-depth migration revokes anonymous privileges on the private base tables so an unexpected legacy RLS policy cannot reopen access.

---

## How the app works (quick reference)

Understanding the data flow helps explain why some fixes matter.

```
Visitor → ChatWidget / FullPageChat
       → POST /api/ai-chat
       → Supabase (profiles, agent_configs, knowledge, messages)
       → Groq API (streaming response)
       → Messages saved back to Supabase

Creator → Dashboard (client-side auth check)
       → Supabase browser client (direct DB reads/writes)
       → Some actions via API routes (checkout, scrape, delete account, etc.)

Billing → Stripe Checkout / Webhooks
       → Service role updates subscriptions table
```

**Key files to know:**

| Area | Location |
|------|----------|
| Public chat API | `app/api/ai-chat/route.js` |
| Auth (signup API) | `app/api/auth/signup/route.js` |
| Auth (login page) | `app/auth/login/page.jsx` |
| Dashboard gate | `app/dashboard/layout.jsx` |
| Supabase server client | `utils/supabase/server.ts` |
| Session middleware (not wired up) | `utils/supabase/middleware.ts` |
| RLS policies | `supabase/migrations/*.sql` |
| Rate limiting | `lib/rate-limit.js` |

---

## Critical — fix immediately

### 1. Agent access passwords are readable from the database

**What:** Password-protected agents store `access_password` in the `agent_configs` table. A Supabase RLS policy allows **anyone** to read the entire row.

**Where:**
- `supabase/migrations/20260511000000_add_agent_access_controls.sql` — adds `access_password` column
- `supabase/migrations/20260508000000_fix_rls_public_access.sql` (lines 22–24) — `"Public agent configs are viewable by everyone"` with `USING (true)`
- `app/[username]/page.jsx` (lines 144–145) — strips password before sending to React, but this only protects the web page, not direct API access

**Why it's a risk:** Anyone with your public Supabase anon key (which is in every user's browser) can run:

```sql
SELECT access_password FROM agent_configs WHERE user_id = '...'
```

Password protection becomes useless.

**Fix:**
1. Remove `access_password` from any public SELECT policy.
2. Create a database view (e.g. `agent_configs_public`) with only safe columns: name, colors, welcome message, access *level* — not the password.
3. Hash passwords server-side (bcrypt/argon2) and compare only in `/api/ai-chat`.
4. Never return the hash or password to the client.

---

### 2. Entire knowledge base is publicly readable

**What:** All active training content (`agent_knowledge.content`) — custom facts, scraped websites, uploaded text — can be read by anyone using the Supabase anon key.

**Where:**
- `supabase/migrations/20241225020000_knowledge_schema.sql` (lines 48–50) — policy `"Public can read active knowledge"` with `USING (is_active = true)`

**Why it's a risk:** Competitors or scrapers can download a user's full private training data without chatting with the agent. This is one of the most sensitive assets in the product.

**Fix:**
1. Drop the public SELECT policy on `agent_knowledge`.
2. Keep owner-only policies for dashboard management.
3. Load knowledge in `/api/ai-chat` using the **service role** (or a server-only client) after verifying the agent is live and the request is authorized.

---

### 3. Signup API accepts a captcha bypass token in production

**What:** The signup route treats `hcaptchaToken: "local-bypass"` as valid captcha verification. This was meant for local development, but the server does **not** check that the request is actually from localhost.

**Where:**
- `app/api/auth/signup/route.js` (lines 19–20, 59)
- `app/auth/signup/page.jsx` (line 107) — sends `local-bypass` when on localhost

**Why it's a risk:** An attacker can POST directly to `/api/auth/signup` with `"local-bypass"` and create unlimited bot accounts without solving hCaptcha.

**Fix:**
```javascript
// Only allow bypass in development
const isLocalBypass =
  process.env.NODE_ENV === 'development' && hcaptchaToken === 'local-bypass';
```
Reject `local-bypass` with 400 in production.

---

### 4. hCaptcha is skipped when the secret key is missing

**What:** If `HCAPTCHA_SECRET_KEY` is not set, the auth routes log a warning and **continue without verifying** captcha.

**Where:**
- `app/api/auth/signup/route.js` (lines 23–24)
- `app/api/auth/login/route.js` (lines 21–22)

**Why it's a risk:** A misconfigured production deploy silently disables bot protection. The UI may still show captcha, giving a false sense of security.

**Fix:** In production, return `503` or `500` if the secret is missing and a captcha token was expected. Never silently skip verification.

---

### 5. `/api/status` and `/api/health` are public and leak internals

**What:** These endpoints require no authentication and return detailed operational data.

**Where:**
- `app/api/status/route.js` — table counts, 24h signups/conversations, memory usage, env validation errors, `hasServiceRoleKey`, feature flags
- `app/api/health/route.js` — env validation, database status, live Groq/Stripe API checks

**Why it's a risk:** Attackers get a free map of your infrastructure: which services are configured, whether env vars are valid, approximate user activity, and error details. This helps targeted attacks.

**Fix:**
- **Production public response:** `{ "status": "ok" }` only.
- **Detailed metrics:** Protect with `CRON_SECRET`, admin auth, or disable entirely on public deployments.
- Remove `hasServiceRoleKey` and env validation details from any public response.

---

### 6. Supabase project metadata committed to git

**What:** Files under `supabase/.temp/` are tracked in the repository, including project reference and pooler URL.

**Where:**
- `supabase/.temp/project-ref` — contains `erxtptqduhmkjswuzzpl`
- `supabase/.temp/pooler-url` — contains pooler hostname and region

**Why it's a risk:** Exposes your Supabase project ID and infrastructure details. If the repo is or was public, attackers can target your project directly.

**Fix:**
1. Add `supabase/.temp/` to `.gitignore`.
2. Remove these files from git history (`git rm --cached`).
3. If the repo was ever public, review Supabase access logs and rotate keys if needed.

---

## High — fix soon

### 7. No RLS policies for `subscriptions` in migrations

**What:** The `subscriptions` table is used everywhere (billing, embed widget, AI limits, trial logic), but there is **no migration** in the repo that creates the table or defines RLS policies for it.

**Where:** Used in many files, e.g.:
- `app/embed/[username]/page.jsx`
- `lib/subscriptionHelpers.js`
- `components/TrialChoiceManager.jsx`
- `app/api/ai-chat/route.js`

**Why it's a risk:** If RLS is missing or too loose in the live database, a user could:
- Read other users' subscription data (Stripe customer IDs, tier, status)
- Update their own `tier`, `status`, or `messages_used` to get free premium access

**Fix:** Add a migration that:
1. Enables RLS on `subscriptions`.
2. Allows users to **SELECT** only their own row (`auth.uid() = user_id`).
3. Allows users to **UPDATE** only safe fields (e.g. `post_trial_choice`).
4. Blocks client updates to `tier`, `status`, `messages_used`, `stripe_customer_id`, `stripe_subscription_id`.
5. Restricts all other writes to service role / webhooks only.

---

### 8. AI chat does not validate conversation ownership

**What:** When a client sends an existing `conversationId`, the API uses it without checking that the conversation belongs to the requested agent owner or the visitor.

**Where:** `app/api/ai-chat/route.js` (lines 208–259)

**Why it's a risk:** If someone learns or guesses a conversation UUID, they can append messages to another user's conversation logs.

**Fix:** When `conversationId` is provided:
1. Look up the conversation in the database.
2. Confirm `agent_owner_id` matches the profile resolved from `username`.
3. Confirm `visitor_id` matches the request (or use a server-issued session token instead of trusting client IDs).

---

### 9. Client controls the full message history sent to Groq

**What:** The API accepts a `messages` array from the request body and passes it directly to Groq with no validation on roles, count, or content length.

**Where:** `app/api/ai-chat/route.js` (lines 130–138, 268–273)

**Why it's a risk:**
- **Prompt injection:** Attacker sends `{ role: "system", content: "Ignore all rules..." }` in the history.
- **Cost abuse:** Extremely long messages or huge history arrays burn Groq tokens.
- **Role spoofing:** Fake `assistant` messages to manipulate context.

**Fix:**
1. Only allow roles `user` and `assistant` in history.
2. Cap message count (e.g. last 20 messages) and character length per message.
3. Prefer loading history from the database for verified conversations instead of trusting the client payload.
4. Sanitize or strip control characters from message content.

---

### 10. Login captcha is shown but not enforced

**What:** The login page displays hCaptcha and requires the user to complete it in the UI, but the actual login call goes **directly to Supabase** from the browser — without sending the captcha token. The `/api/auth/login` route (which does verify captcha) is **never used**.

**Where:**
- `app/auth/login/page.jsx` (lines 81–98) — validates captcha in UI, then calls `supabase.auth.signInWithPassword()` with no captcha
- `app/api/auth/login/route.js` — has captcha logic but is unused

**Why it's a risk:** Brute-force login attacks can bypass your captcha entirely by calling Supabase Auth API directly. Your rate limit on `/api/auth/login` also does nothing because nobody hits that route.

**Fix (pick one):**
- **Option A:** Route login through `/api/auth/login` and verify captcha server-side before calling Supabase.
- **Option B:** Pass `captchaToken` to `signInWithPassword` options (if Supabase captcha is enabled on the project).
- Also enable Supabase Auth rate limiting in the Supabase dashboard.

---

### 11. Dashboard is only protected on the client

**What:** `app/dashboard/layout.jsx` checks auth in a `useEffect` and redirects to login. There is no server-side or middleware check before the page loads.

**Where:** `app/dashboard/layout.jsx` (lines 22–56)

**Why it's a risk:** Unauthenticated users can still request dashboard URLs and receive page HTML/JS. Security depends entirely on Supabase RLS blocking every query — one missing policy exposes data.

**Fix:**
1. Add root `middleware.ts` that calls `updateSession` from `utils/supabase/middleware.ts`.
2. Redirect unauthenticated users away from `/dashboard/*` before the page renders.
3. Keep client-side checks as a UX fallback, not the primary gate.

---

### 12. Session middleware exists but is not connected

**What:** `utils/supabase/middleware.ts` has session refresh logic, but there is no `middleware.ts` at the project root, so it never runs.

**Where:** `utils/supabase/middleware.ts` (exists), root `middleware.ts` (missing)

**Why it's a risk:** Supabase sessions may expire without being refreshed. Server Components and API routes can see stale or missing auth state. This causes subtle logout bugs and weakens server-side protection.

**Fix:** Create `middleware.ts` at the project root:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Then extend it to protect `/dashboard` routes.

---

### 13. Agent document storage bucket is public

**What:** The `agent-documents` Supabase storage bucket is created with `public: true`. Files are stored at predictable paths like `{userId}/{timestamp}-{filename}`.

**Where:**
- `supabase/migrations/20260511060000_setup_agent_documents_storage.sql` (lines 2–4)
- `app/dashboard/agent/documents/page.jsx` (line 147) — upload path pattern

**Why it's a risk:** If someone knows or guesses the file path, they can download private PDFs/resumes without authentication. User IDs are discoverable from public profiles.

**Fix:**
1. Set the bucket to **private** (`public: false`).
2. Use signed URLs for any legitimate download need.
3. Keep document processing server-side via `/api/process-document` (already auth-protected).

---

### 14. Cron jobs trust the `x-vercel-cron` header alone

**What:** Cron endpoints allow requests that include `x-vercel-cron: 1` without also requiring `CRON_SECRET`.

**Where:**
- `app/api/cron/account-deletions/route.js` (lines 12–16)
- `app/api/subscriptions/check-trials/route.js` (lines 13–16)

**Why it's a risk:** Depending on deployment, external callers may be able to spoof this header and trigger account deletions or mass trial-expiry emails.

**Fix:** In production, **always** require `Authorization: Bearer ${CRON_SECRET}`. Treat `x-vercel-cron` as informational only, or configure Vercel crons to send the secret header.

---

## Medium — fix when you can

### 15. Access passwords stored in plaintext

**What:** Agent gate passwords are saved and compared as plain strings.

**Where:**
- `app/api/ai-chat/route.js` (line 196) — `accessPassword !== config.access_password`
- `app/dashboard/agent/page.jsx` (lines 495–500) — password input stored directly

**Why it's a risk:** Any database leak immediately exposes all agent passwords.

**Fix:** Hash on save, compare with `bcrypt.compare()` in the API. Show "password is set" in the dashboard instead of the raw value.

---

### 16. Anyone can insert conversations and messages

**What:** RLS allows unauthenticated INSERT on `agent_conversations` and `agent_messages` with `WITH CHECK (true)`.

**Where:** `supabase/migrations/20241225020000_knowledge_schema.sql` (lines 37–42)

**Why it's a risk:** Attackers can spam the database with fake conversations and messages. User message inserts also increment `messages_used` via a database trigger — potentially exhausting a victim's message quota.

**Fix:**
1. Remove public INSERT policies.
2. Perform all conversation/message writes in `/api/ai-chat` using the service role after validation.
3. Add rate limiting per IP and per agent.

---

### 17. `/api/track-view` has no rate limiting

**What:** Public endpoint records page views. No auth, no rate limit.

**Where:** `app/api/track-view/route.js`

**Why it's a risk:** Easy to inflate analytics for any username or flood the `page_views` table.

**Fix:** Add rate limiting (reuse `lib/rate-limit.js`). Validate `username` and `visitor_id` format. Consider deduplicating views per visitor per day.

---

### 18. `/api/errors` POST is open and unlimited

**What:** Client error reporting accepts any POST with no auth or rate limit.

**Where:** `app/api/errors/route.js` (lines 6–38)

**Why it's a risk:** Log spam, memory growth in the in-process monitoring store, noise that hides real errors.

**Fix:** Rate limit by IP. Cap payload size. Validate required fields. Require auth for the GET metrics endpoint in all environments (not just production).

---

### 19. Login API logs sensitive data

**What:** The login API route logs email addresses and hCaptcha tokens to server logs.

**Where:** `app/api/auth/login/route.js` (line 14)

**Why it's a risk:** PII and single-use tokens in logs can leak via log aggregators, support access, or breaches.

**Fix:** Remove or redact. Log only `{ event: 'login_attempt', success: boolean }`.

---

### 20. RLS write policies missing from migrations for some tables

**What:** Several tables have public SELECT policies in migrations, but owner INSERT/UPDATE/DELETE policies are missing or incomplete in the repo.

**Affected tables (based on migration review):**
- `agent_configs` — public SELECT only, no owner write policy in migrations
- `profiles` — public SELECT only, no UPDATE policy in migrations
- `social_links` / `custom_links` — public SELECT only, no write policies in migrations

**Why it's a risk:** Policies may exist only in the live Supabase dashboard (undocumented). New environments or teammates won't reproduce correct security. Or writes may fail silently / behave inconsistently.

**Fix:** Audit live Supabase policies, then add complete migrations for every table: SELECT (public vs owner), INSERT, UPDATE, DELETE.

---

### 21. Client-side function can update subscription usage

**What:** `incrementUsage()` in `lib/subscriptionHelpers.js` updates `messages_used` directly from the browser Supabase client.

**Where:** `lib/subscriptionHelpers.js` (lines 116–132)

**Why it's a risk:** If RLS allows it, a user could reset or lower their own `messages_used`. Message counting should be server/trigger-only.

**Fix:** Remove client-side usage updates. Rely on the existing DB trigger (`20260523000100_count_only_user_messages_for_usage.sql`). Lock down RLS so clients cannot UPDATE `messages_used`.

---

### 22. Hardcoded Stripe price IDs in frontend code

**What:** Fallback Stripe price IDs are embedded in client-side code for non-production builds.

**Where:**
- `app/pricing/page.jsx` (lines 191–196)
- `app/api/checkout/route.js` (lines 11–17)

**Why it's a risk:** Test price IDs ship in the bundle. Makes checkout flow easier to probe. Should not appear in production builds at all.

**Fix:** Use environment variables only. Keep dev fallbacks in server-side code guarded by `NODE_ENV === 'development'`, never in client components.

---

### 23. Account deletion dates may be publicly visible

**What:** `account_deletion_requested_at` and `account_deletion_scheduled_for` were added to `profiles`, which has a public SELECT policy.

**Where:**
- `supabase/migrations/20260614000000_add_account_deletion_fields.sql`
- `supabase/migrations/20260508000000_fix_rls_public_access.sql` — public profiles SELECT

**Why it's a risk:** Privacy leak — anyone could see when a user scheduled account deletion.

**Fix:** Exclude these columns from public access. Use a `profiles_public` view or column-level restrictions.

---

### 24. In-memory rate limiting does not work across servers

**What:** `lib/rate-limit.js` stores counters in a local `Map`. Each Vercel/server instance has its own memory.

**Where:** `lib/rate-limit.js`

**Why it's a risk:** An attacker can exceed limits by hitting different instances. Especially affects `/api/ai-chat` (Groq cost) and `/api/scrape`.

**Fix:** For launch this is acceptable on a single instance. When scaling, move to Redis, Upstash, or Vercel KV. Prioritize shared limits on costly endpoints first.

---

### 25. Signup API lacks server-side input validation

**What:** Signup accepts `email`, `password`, `username`, and `profession` from the body with minimal validation.

**Where:** `app/api/auth/signup/route.js` (lines 15–16)

**Why it's a risk:**
- Usernames could be offensive, reserved, or impersonate brands
- Weak passwords allowed
- Invalid emails passed to Supabase

**Fix:** Validate server-side:
- Username: alphanumeric + underscore, length 3–30, block reserved names (`admin`, `api`, etc.)
- Password: minimum 8 characters (or your policy)
- Email: format check
- Return clear 400 errors before calling Supabase

---

## Lower priority — still worth doing

### 26. Embed widget may conflict with `X-Frame-Options: DENY`

**What:** `next.config.ts` sets `X-Frame-Options: DENY` on all routes, including `/embed/[username]`.

**Where:** `next.config.ts` (lines 24–26, 66–70)

**Why it matters:** Third-party sites embed the chat via iframe (`public/qlynk-agent.js` → `/embed/{username}`). `DENY` blocks all framing, so the embed may not work on external sites.

**Fix:** Override headers for `/embed/*` only. Use `Content-Security-Policy: frame-ancestors https://trusted-partner.com` instead of removing protection globally. Keep `DENY` on dashboard and auth pages.

---

### 27. Embed chat uses `postMessage` with wildcard origin

**What:** The chat widget sends resize events to the parent frame with target origin `*`.

**Where:** `components/ChatWidget.jsx` (line 45)

**Why it's a risk:** Low severity — any parent page receives open/close events. Could leak widget state to a malicious embedder.

**Fix:** Pass the parent origin from the embed script and use that as the `postMessage` target instead of `*`.

---

### 28. `/api/status` may crash due to incorrect Supabase client usage

**What:** The status route calls `createClient()` with no cookie store argument, but `utils/supabase/server.ts` requires one.

**Where:** `app/api/status/route.js` (line 14)

**Why it matters:** The endpoint may throw at runtime, which is both a reliability issue and a sign it isn't production-ready.

**Fix:** Fix the client initialization or remove the endpoint's DB metrics section. If keeping it, protect it (see item #5).

---

## Recommended fix order

| Phase | Items | Goal |
|-------|-------|------|
| **Phase 1** | #1, #2, #3, #4, #6 | Stop active data exposure and bot bypass |
| **Phase 2** | #5, #7, #8, #9, #10 | Lock down API and subscription integrity |
| **Phase 3** | #11, #12, #13, #14 | Auth hardening and infrastructure |
| **Phase 4** | #15–#25 | Abuse prevention, privacy, cleanup |
| **Phase 5** | #26–#28 | Embed UX and polish |

---

## What's already in good shape

- Stripe webhooks verify signatures (`app/api/webhooks/stripe/route.js`)
- Checkout confirm checks session belongs to logged-in user (`app/api/checkout/confirm/route.js`)
- Account deletion requires typed confirmation + email match (`app/api/account/delete/route.js`)
- URL scraper blocks SSRF to private IPs (`app/api/scrape/route.js`)
- Security headers and CSP configured in `next.config.ts`
- Rate limiting exists on AI chat, auth signup, auth login API, and scrape (even if login API is unused)
- Document processing route checks ownership (`app/api/process-document/route.js`)
- `.env*` files are gitignored

---

## Notes for reviewers

- This audit is based on **code and migrations in the repo**. Live Supabase policies may differ from what's in migrations — compare against the Supabase dashboard.
- Several issues compound: public knowledge read (#2) + weak rate limits (#24) = easy bulk exfiltration.
- The anon key is intentionally public in Next.js apps; **RLS is your real firewall**. Treat every table policy as security-critical.

---

*Generated from security audit — July 2026*
