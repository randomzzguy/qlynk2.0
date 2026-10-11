# Free Creator and open-source rollout

Decision date: 2026-10-11. Owner-approved: permanent free Creator, existing allowances, unchanged Agency pricing, MIT license.

## Product contract

| Hosted plan | Price (USD) | Messages per calendar month | Agents | Branding |
| --- | --- | --- | --- | --- |
| Creator | Free, no expiry or card | 5,000 | 1 | Powered by Qlynk |
| Agency | $38/month or $360/year | 10,000 | 1 | Qlynk attribution removed |

Both plans include existing knowledge inputs, document support, conversations, analytics, rules, public links, widgets, and visitor access controls. Current document limit is 3 MB per file for both plans. No new storage allowance, multi-agent workspace, priority support, or Agency-only capability is promised by this release.

An administrator can grant complimentary Agency through the protected subscription record: active Agency with no Stripe subscription. It receives the same Agency allowance and branding benefits. Ordinary owners cannot edit these entitlements. The updated billing page labels complimentary access and the checkout endpoint refuses paid checkout for it.

Self-hosting uses the MIT-licensed source with the operator's own infrastructure and provider credentials. Hosted Agency billing is optional; infrastructure and AI providers can charge self-hosting operators independently.

## Implementation checklist

- [x] Central plan/pricing definitions and free fallback entitlement rules.
- [x] Signup defaults and old trial/free account migration (without changing agent enablement or deleting knowledge).
- [x] Agency-only checkout; legacy paid subscription compatibility; cancellation fallback; billing-event regressions.
- [x] Monthly credit reset and atomic limits for long-lived free accounts.
- [x] Pricing cards, free signup path, onboarding confirmation, dashboard and billing labels.
- [x] Marketing pages, FAQs, comparison copy, structured data, crawler-facing product facts.
- [x] Welcome and retired trial emails; trial-expiry job cannot turn agents off.
- [x] Qlynk product-agent Build Pack, authoritative product facts/instructions, atomic apply/undo, and pre-release answer checks.
- [x] MIT license, README, environment example, contribution/security guidance, publication readiness.
- [x] Automated tests, migrations, lint, production build, and HTTP/browser smoke checks.
- [x] Release instructions, evidence, outstanding external actions, and rollback guidance.

## Release gate

Local changes are prepared and verified before any production migration, deployment, repository visibility change, or live product-agent publication. Keep this document updated with actual verification and release state. Do not claim the GitHub repository is public until its visibility is verified.

The repository's existing public visibility has been verified. This checkout's license, code and documentation are **not yet pushed or deployed**. No production SQL migration or Stripe write was made and no live agent content was published. The owner explicitly authorized two personal accounts to receive complimentary Agency on 2026-10-11. Those production subscription records were updated and read back successfully: active Agency, no expiry or Stripe links, existing usage and all unrelated fields preserved. Private rollback snapshots remain in ignored local scratch files. The billing labels and checkout protection are local changes pending deployment.

## Ordered production release

1. **Resolve remaining billing record.** The initial read-only preflight found 17 old trial/free rows and three Creator/Pro rows linked to Stripe. The owner confirmed that the two missing Stripe links belonged to manually granted personal accounts with no payment; those accounts now have verified complimentary Agency as described above. One canceled linked Creator subscription remains untouched. There are zero nonterminal historical Creator subscriptions in the configured account, and Agency prices match $38/$360 USD. Reconcile the remaining verified terminal link to free Creator while retaining its customer identity, record a private rollback snapshot, and rerun `npm run verify:free-creator`. Do not publish customer IDs in GitHub.
2. **Verify email.** Read-only Resend domain verification returned HTTP 401. Determine whether the key is restricted to sending or invalid, and verify the configured sender through the provider dashboard. Supabase Auth email is separate. An actual test email needs a chosen recipient and explicit sending authorization; none was sent in this work session.
3. **Back up and confirm rollout.** Verify current database backups and migration ledger. Obtain the owner's acceptance of the concrete release and product-agent Build Pack. Remove Creator prices from the Stripe Customer Portal upgrade catalog; retain historical IDs in environment variables for event reconciliation. Confirm no old August coupon is automatically applied to Agency checkout.
4. **Apply database compatibility first.** Apply only the missing migrations, including `20261011010000_free_creator_plan.sql` and `20261011020000_qlynk_product_facts_update.sql`. The first enables permanent free defaults and atomic UTC month rollover. The second installs the private product-agent update/undo workflow but does not publish facts by itself. Preserve paused accounts and agent offline settings. Owners whose agents were already disabled can enable them themselves.
5. **Publish source and deploy app.** Include the MIT license, environment example, contributor guidance and lockfile. Use the existing public repository; do not change visibility or include `.env.local`, scratch artifacts, customer records or the unrelated social images. Use `NEXT_PUBLIC_BILLING_ENABLED=1` for hosted Qlynk. Retire any external trial-expiry scheduler in addition to the removed Vercel schedule. The old protected endpoint is an inert compatibility response.
6. **Publish product-agent update.** In the `qlynk` account, open Knowledge Base → Review product update. Review eight sources, affected archived titles, changed allowed topics/behavior and advanced instructions. Apply only after the deployed pricing page matches. The update is atomic and creates a private backup plus a new rule version.
7. **Accept the live release.** Run HTTP/provider checks; verify a new free signup and onboarding in an isolated test account, returning old-trial access, both usage caps and rollover, standalone/embed branding, Agency checkout/portal and cancellation fallback. Exercise paid flows with an isolated Stripe test configuration instead of charging a real card. Repeat the fourteen questions in the [agent answer report](QLYNK_PRODUCT_AGENT_ANSWER_EVALUATION.md) against the public agent and widget, including wording variations. Record actual outcomes.
8. **Monitor.** Review errors, quota reservations, invoice failures, unexpected Creator billing and agent knowledge gaps. The production monitor runs for the official repository or an explicitly configured fork origin; forks do not monitor Qlynk by default.

## Rollback

- Keep the database free-plan compatibility migration in place. Blindly redeploying the old trial-based app would contradict the new offer; use a corrected release that retains Creator defaults and retired trial expiry.
- For agent content, use **Undo product update** to restore the backed-up sources/instructions as a new prompt version. This restores obsolete pricing too: coordinate it with deployment or promptly replace it with corrected current facts before allowing public answers.
- Correct billing with verified provider state and retained customer links; never detach a subscription merely to make the release preflight green. No user knowledge, conversations, usage counts or enablement state should be deleted during a plan rollback.

## Evidence and limits

Local verification covers plan transitions, Stripe event reconciliation, calendar quotas, SQL privileges/rollback, safe source handling and public HTTP routes. Full production acceptance is separate. The complete SQL chain has 53 migrations. The [Build Pack](QLYNK_PRODUCT_AGENT_FREE_CREATOR_BUILD_PACK.md) records the actual live source/instruction audit and preparation status.

Credential-pattern scans passed for tracked/new files and 1,190 historical text blobs; they are not a comprehensive security audit. Compatible dependency updates address the discovered critical/high production advisories. The remaining production audit finding is a moderate `sprintf-js`/`argparse` dependency chain under Mammoth; npm's offered forced fix downgrades Mammoth to an obsolete incompatible release and was not applied. Track this upstream and continue constraining untrusted document processing.

Final local checks: 133/133 tests passed; 53 migrations and all embedded-database security invariants passed, including preservation and quota enforcement for complimentary Agency; lint clean; Next.js 16.3.8 production build passed (140 pages); HTTP smoke passed; environment validation passed 13/13; credential-pattern checks passed; production audit has zero critical/high findings and the three moderate dependency advisories described above. The existing ESLint configuration version is retained; migrating the unrelated application's compiler lint rules is outside this release.

Browser checks verified monthly/annual Agency pricing, unchanged free Creator while toggling billing, Creator CTA → signup with free/no-card copy, shared storage FAQ wording, and desktop/mobile layouts without horizontal overflow at 1440 px and 390 px. No signup was submitted into production and no paid checkout was performed. Fourteen actual pre-release agent prompt responses and two corrected retests are recorded in the answer report. Live integration verification remains partial because of the Resend domain-listing restriction, and the read-only billing preflight remains gated on the one remaining canceled legacy link.

## Initial audit findings

- Signup creates a 14-day trial; trial expiry cancels access and sends offline warnings.
- Creator is offered through Stripe. Remove it from new checkout while retaining recognition of historical prices.
- Subscription deletion currently writes `tier=free,status=canceled`, which provides no agent access.
- Message credits have an atomic reservation but no implemented calendar-month reset; permanent free accounts require a working reset.
- Storage has a shared 3 MB document cap, not a tier-specific storage allowance.
- Homepage demo is Northstar Studio; the Qlynk product agent is a separate hosted account and must be checked independently.
- README references a missing environment example and claims all rights reserved.
- Pre-existing untracked social images and `tmp/` are outside this change.
