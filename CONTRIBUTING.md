# Contributing to Qlynk

Thanks for helping make focused knowledge agents more accessible.

1. Open an issue describing the problem, expected behavior and reproduction steps. For security issues, use [SECURITY.md](SECURITY.md) instead of a public issue.
2. Fork the repository and create a branch. Follow [README.md](README.md) for local setup and [AGENTS.md](AGENTS.md) for framework-specific guidance.
3. Make a focused change. Add regression coverage when changing billing, authorization, message quotas, knowledge processing or agent behavior.
4. Run `npm test`, `npm run lint`, `npm run verify:migrations`, and `npm run build`. Record any unavailable provider checks explicitly.
5. Open a pull request explaining the problem, changed behavior and verification. Include screenshots for visible changes.

Never commit credentials, `.env.local`, customer documents, conversation transcripts, database exports or provider connection details. Use a separate development Supabase project and Stripe test account. Keep server authorization and atomic quota enforcement intact.

`lib/plans.js` defines hosted entitlements; `lib/pricing.js` defines prices; `lib/qlynk-product-facts.js` contains maintained product answers. Update all affected public surfaces and regression tests when the product contract changes. New Agency benefits must be implemented and enforced before they are advertised.

Contributions are licensed under the repository’s MIT license. Use only code and assets you have permission to contribute, and retain third-party license notices.
