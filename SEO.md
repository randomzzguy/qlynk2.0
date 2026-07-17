# Qlynk SEO implementation log

Last verified: 2026-07-18

This file records what was found in the code, what was improved, and what still requires a real company detail or an external account. A checked item means the repository work is complete; it does not mean an undeployed change is already live in production.

Status key:

- ✅ Implemented and verified locally
- 🟡 Repository work done, but an external action or confirmed business detail is still required
- ⚪ Intentionally not applicable yet; adding it now would create misleading structured data

## Critical

### 1. Add JSON-LD structured data — 🟡

- [x] Verified that `Organization`, `WebSite`, and `SoftwareApplication` already existed in `app/layout.jsx`.
- [x] Improved them into one connected `@graph` with stable `@id` references.
- [x] Added Qlynk AI naming, alternate product names, description, URL, logo, publisher, audience, feature list, application category, Web operating system, and current trial/monthly offers.
- [x] Added safe JSON-LD rendering through `components/JsonLd.jsx`.
- [ ] Add `sameAs` after Qlynk's official social profile URLs are confirmed. No URLs were invented.
- [x] Did not add a duplicate `Product` entity because `SoftwareApplication` describes the product more accurately.

### 2. Strengthen brand positioning — ✅

- [x] Made `Qlynk AI` the site/schema name.
- [x] Made `Personal AI Agent` the primary category phrase.
- [x] Kept `AI Clone`, `Personal AI`, `AI Ambassador`, and `Digital Twin` as supporting terms where they add context.
- [x] Changed the homepage H1 from `AI Ambassador` to `AI Agent` and strengthened the supporting sentence.

### 3. Create an FAQ section — ✅

- [x] Verified that `/faq` already existed.
- [x] Reworked it to answer all seven priority questions: what Qlynk is, how it works, who it is for, chatbot comparison, ChatGPT comparison, availability while the owner is offline, and supported training data.
- [x] Improved overconfident privacy/accuracy language and added clearer controls, limits, pricing, and sharing answers.

### 4. Add FAQ schema — ✅

- [x] Added `FAQPage` JSON-LD generated from the same visible FAQ content.
- [x] Added breadcrumb schema to `/faq`.
- [x] Verified the rendered HTML contains `FAQPage`.

## High priority

### 5. Improve the title tag — ✅

- [x] Homepage title is now `Qlynk AI | Create Your Personal AI Clone`.
- [x] Every indexable marketing route now has a route-specific title instead of inheriting the homepage title.

### 6. Improve the meta description — ✅

- [x] Homepage description now naturally includes personal AI clone, AI agent, creators, professionals, and founders.
- [x] Added focused descriptions for pricing, FAQ, landing pages, feature pages, articles, About, Press, Privacy, and Terms.

### 7. Add canonical URLs — ✅

- [x] Fixed the main issue found during the audit: the root canonical could be inherited by child pages and incorrectly identify them as homepage duplicates.
- [x] Added a shared metadata helper that emits a unique canonical for every indexable marketing page.
- [x] Added canonical URLs to public `/{username}` agent pages.
- [x] Added `X-Robots-Tag: noindex, nofollow` to auth, dashboard, API, onboarding, creation, embed, preview, and internal theme routes instead of giving private/utility pages canonical URLs.
- [x] Verified rendered canonical and `og:url` values on representative routes.

### 8. Verify Open Graph tags — ✅

- [x] Centralized `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, and `siteName`.
- [x] Added descriptive Open Graph image alt text.
- [x] Retained dynamic titles, descriptions, images, and URLs for public Qlynk Agent pages.

### 9. Add Twitter/X meta tags — ✅

- [x] Centralized `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` for indexable routes.
- [x] Verified `summary_large_image` in rendered HTML.

### 10. Improve alt text — ✅

- [x] Replaced generic `qlynk logo`, `Avatar`, and `Profile` text with descriptive Qlynk AI, agent-avatar, or user-avatar labels.
- [x] Marked decorative Qlynk icon images with empty alt text.
- [x] Fixed an unused animation component that referenced a nonexistent `/assets/icon.svg` asset.
- [x] Kept dynamic profile and agent names in dynamic image alt text.

## Medium priority

### 11. Create SEO landing pages — ✅

- [x] `/ai-clone`
- [x] `/personal-ai`
- [x] `/ai-agent`
- [x] `/digital-twin`
- [x] `/for-creators` (verified existing and improved metadata)
- [x] `/for-founders` (verified existing and improved metadata)
- [x] `/for-freelancers` (verified existing and improved metadata)
- [x] `/for-business`
- [x] `/pricing` (verified existing and added complete metadata)

The new focused routes share a reusable component but have distinct titles, descriptions, definitions, benefits, canonicals, and breadcrumbs.

### 12. Improve internal linking — ✅

- [x] Added Product, Resources, and FAQ to homepage navigation.
- [x] Linked homepage feature cards to their specific feature pages.
- [x] Expanded the footer across product, use-case, resource, About, Press, Privacy, and Terms routes.
- [x] Added natural landing-page links to Pricing, FAQ, signup, and adjacent topic pages.
- [x] Added visible breadcrumb navigation plus `BreadcrumbList` schema to new landing and feature pages.

### 13. Publish educational articles — ✅

- [x] Verified existing articles: `What Is an AI Clone?`, `How to Create Your AI Clone`, and `AI Clone vs Chatbot`.
- [x] Added `AI Clone vs ChatGPT`.
- [x] Added article metadata, canonicals, social cards, `Article` schema, and breadcrumb schema.
- [x] Added accurate `HowTo` schema whose steps point to real heading IDs in the existing creation guide.

More founder, consultant, and creator articles can be added as an ongoing editorial program; thin near-duplicate articles were not mass-generated merely to increase page count.

### 14. Add feature-specific pages — ✅

- [x] `/features/ai-training`
- [x] `/features/knowledge-base`
- [x] `/features/website-widget`
- [x] `/features/analytics`
- [x] `/features/integrations`
- [x] `/features/security`
- [x] `/pricing` remains the dedicated pricing page.

### 15. Expand semantic content — ✅

- [x] Added explicit definitions of Qlynk, personal AI agents, AI clones, and digital twins.
- [x] Added audience, problem, benefit, control, and ChatGPT-comparison content across the homepage, FAQ, landing pages, About page, and articles.
- [x] Avoided claims that an agent works without internet or that AI answers are guaranteed to be perfect.

## Technical SEO

### 16. Verify `robots.txt` — ✅

- [x] Allows public crawling.
- [x] References `https://www.qlynk.site/sitemap.xml`.
- [x] Disallows auth, API, dashboard, admin, creation, onboarding, internal theme, preview, and embed routes.
- [x] Verified the generated `/robots.txt` response locally.

### 17. Verify `sitemap.xml` — 🟡

- [x] Rebuilt the sitemap from a single route inventory covering all indexable marketing, use-case, article, feature, company, and legal pages.
- [x] Added live, public, subscription-valid Qlynk Agent profile pages from Supabase.
- [x] Excludes disabled, non-public, and non-live agents.
- [x] Revalidates hourly so profile coverage updates without a new deployment.
- [x] Verified 30 URLs in the local generated sitemap: 27 repository routes and 3 currently eligible public-agent routes.
- [ ] Submit the deployed sitemap in Google Search Console and Bing Webmaster Tools. This requires the owner's external accounts and cannot be completed in repository code.

### 18. Add a web app manifest — ✅

- [x] Verified a manifest existed but its name and short name were empty and its icon paths were wrong.
- [x] Added full name, short name, description, correct 192/512 icon paths, start URL, scope, dark theme/background colors, and standalone display mode.
- [x] Verified the generated manifest parses and references two real icons.

### 19. Validate heading structure — ✅

- [x] Verified one rendered H1 on representative indexable routes, including the homepage, pricing, FAQ, landing, feature, article, and About pages.
- [x] New pages use H1 followed by H2 and H3 sections.
- [x] Multiple source-level H1 branches on dynamic/error or multi-step private screens do not render simultaneously and are not indexable marketing pages.

### 20. Ensure semantic HTML — ✅

- [x] Added a real `<main>` boundary to the homepage.
- [x] New pages use `<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, and the shared `<footer>` where appropriate.
- [x] Existing educational pages already use article/header/heading structure.

## AI search optimization

### 21. Add an About Qlynk section — ✅

- [x] Replaced the vague homepage company paragraph with an explicit, quotable Qlynk definition.
- [x] Added a link to the full About page.

### 22. Add an About the Company page — 🟡

- [x] Added `/about` with mission, vision, company story, product definition, and the currently verified privacy contact.
- [ ] Add the founder's name/bio and confirmed general company contact after the owner supplies them. They were not invented.

### 23. Create a Press Kit — 🟡

- [x] Added `/press`.
- [x] Added downloadable black and white SVG logos and the current product/social image.
- [x] Added a short product description and reusable company boilerplate.
- [ ] Add a dedicated media email and additional approved product screenshots after those assets/details are confirmed.

### 24. Standardize terminology — ✅

- [x] Primary category: `Personal AI Agent`.
- [x] Brand/product name: `Qlynk AI` / `Qlynk Agent`.
- [x] Supporting terms: `AI Clone`, `Personal AI`, `AI Assistant`, `AI Avatar`, and `Digital Twin`.
- [x] Supporting terms are now explained instead of being swapped without context.

### 25. Build third-party mentions — 🟡

- [x] The new Press Kit provides consistent text and assets for directory submissions.
- [ ] Product Hunt, BetaList, AlternativeTo, Futurepedia, There's An AI For That, and other listings require owner-approved external accounts, launch timing, and submission authority. No external listings were created from repository access.

## Nice to have

### 26. Add video structured data — ⚪

- [x] Verified there is no real product video on the indexed pages.
- [ ] Add `VideoObject` only when a real hosted demo exists with a thumbnail, upload date, duration, and content URL.

### 27. Add breadcrumb schema — ✅

- [x] Added reusable `BreadcrumbList` generation.
- [x] Applied it to FAQ, articles, landing pages, feature pages, About, and Press.

### 28. Add review schema — ⚪

- [x] Did not add review/rating schema because the repository has no verified customer rating source. Fabricated review markup would be misleading and can violate search-engine structured-data policies.

### 29. Add How-To schema — ✅

- [x] Added `HowTo` schema to the existing `How to Create Your AI Clone` guide.
- [x] Matched schema names, positions, and URLs to five real visible steps.

### 30. Add SearchAction schema — ⚪

- [x] Verified the public website does not have an internal site-search feature.
- [ ] Add `SearchAction` only if a real search route and query target are implemented.

## Code-level audit results

- [x] Metadata/head audit: created `lib/seo.js` and removed conflicting child-page inheritance for indexable pages.
- [x] JSON-LD audit: Organization, WebSite, SoftwareApplication, FAQPage, Article, HowTo, and BreadcrumbList are tied to visible content.
- [x] Robots/indexability audit: public routes crawl; private/utility routes are disallowed and return `X-Robots-Tag: noindex, nofollow`.
- [x] Sitemap audit: generated route inventory plus eligible live public agents, hourly revalidation, and robots reference.
- [x] Manifest audit: real names, real icon paths, and correct colors.
- [x] Image audit: Next Image remains in use; generic alt text and one broken asset reference were corrected.
- [x] Heading/semantic audit: one rendered H1 on representative indexable pages and semantic main/article/section boundaries.
- [x] Broken-link smoke: 30 public HTML/SEO/asset endpoints returned HTTP 200 locally.
- [x] Redirect check: tested public endpoints resolved directly without redirect chains.
- [x] Caching: marketing pages are statically generated by Next.js; the sitemap uses a one-hour revalidation interval.
- [x] Build verification: `npm run lint` and `npm run build` both pass; Next generated 63 application routes/pages.
- [ ] Core Web Vitals: measure the deployed production build with real field data after these changes are shipped. Local code/build checks cannot substitute for Chrome UX Report data.
- [ ] Structured-data external validation: run the deployed URLs through Google Rich Results Test and Schema.org Validator after deployment.

## Remaining owner/external actions

1. Provide confirmed official social URLs for Organization `sameAs`.
2. Provide founder name/bio, a general company contact, a media email, and any approved product screenshots.
3. Deploy these changes, then submit `/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
4. Validate deployed structured data and collect production Core Web Vitals.
5. Create third-party directory listings using the consistent copy and assets on `/press`.
