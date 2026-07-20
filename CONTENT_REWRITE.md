# Qlynk site-wide content rewrite

Date: 2026-07-21

## Source of truth

The current homepage and implemented product were used as the source of truth:

- Qlynk turns repeated questions and owner-approved information into a focused AI agent.
- The owner chooses the agent's job, audience, knowledge, behavior, limits, and human handoff.
- Visitors use the agent through a shareable `qlynk.site/username` link or website embed.
- Owners can review conversations, identify knowledge gaps, and improve the agent over time.
- “AI clone” and “digital twin” are supporting discovery terms, not promises of impersonation or unrestricted autonomy.

## Route-by-route review

| Route or group | Issue found | What changed |
| --- | --- | --- |
| `/` | One setup step still referred vaguely to “your voice.” | Replaced it with the actual supported knowledge inputs: approved facts, FAQs, links, and documents. |
| `/ai-agent` | The page described the platform correctly but did not lead with the homepage problem. | Reframed it around turning repeated questions into a focused agent, then explained job, knowledge, rules, publishing, and improvement. |
| `/ai-clone` | “Represents you 24/7” could imply impersonation and overstate availability. | Defined an AI clone as a clearly identified representative of approved knowledge, not a pretend version of a person. |
| `/personal-ai` | Copy focused on broad expertise and around-the-clock presence. | Reframed it around making selected professional knowledge available through one link with explicit controls. |
| `/digital-twin` | The term could imply a complete identity copy. | Added a clear definition: approved professional context, not a human replacement or permission to impersonate. |
| `/features/ai-training` | “Training” copy was generic. | Explained the actual inputs and response controls available in the product. |
| `/features/knowledge-base` | The page did not connect knowledge management to the repeated-question problem. | Centered approved sources, removability, and conversation-driven knowledge gaps. |
| `/features/website-widget` | Copy described embedding without the handoff model. | Connected the widget to the same agent identity, knowledge, limits, and human next step. |
| `/features/analytics` | Copy was broad engagement language. | Focused it on real questions, recurring topics, and missing information. |
| `/features/integrations` | Copy was channel-led. | Reframed it as one consistent agent shared wherever people already find the owner. |
| `/features/security` | Security language was abstract. | Made purpose, allowed topics, blocked topics, uncertainty, and escalation the core of the page. |
| `/for-freelancers` | Promised lead capture while sleeping and automatic booking. | Rebuilt the page around explaining services, showing approved proof, and handing off real interest. |
| `/for-founders` | Claimed to handle investors, press, and customers on the founder's behalf. | Rebuilt it around consistent company answers, audience-specific context, and learning what remains unclear. |
| `/for-creators` | Claimed the clone could reply to every follower in the creator's voice. | Rebuilt it around helping audiences find approved content, resources, FAQs, and next steps. |
| `/for-job-seekers` | Marketed an “interactive AI resume” with unsupported attention claims. | Rebuilt it around adding reviewed project and experience context beyond a resume. |
| `/for-business` | The page was broad pre-sales positioning. | Rebuilt it around routine service, policy, product, and process questions with boundaries and escalation. |
| `/pricing` | Creator showed 2,000 messages although code enforces 5,000; document-count claims were not evidenced; Agency claimed unimplemented multi-agent, custom-domain, priority-support, and advanced-analytics features; the trial did not actually match Agency. | Corrected Creator to 5,000 messages, removed unsupported claims, made the 14-day trial match Agency's 10,000-message allowance and removal of the visible “Powered by Qlynk” label in code, and rewrote the cards and FAQ around the verified current differences. |
| `/faq` | Several answers used the older platform-first wording and a “5-minute setup” promise. | Rewrote the core definition, workflow, audience, setup expectation, and CTA around reviewed knowledge and limits. |
| `/about` | Mission and story were accurate but abstract. | Rewrote them around the human problem of repeated explanations and the need for controlled access to useful answers. |
| `/press` | Boilerplate did not reflect the homepage's clearest promise. | Updated the short description and boilerplate with the repeated-question workflow and current controls. |
| `/blog` | The resource hub positioned AI clones as the future of personal presence. | Rebuilt it as a practical library for designing, testing, and maintaining useful focused agents. |
| `/blog/what-is-an-ai-clone` | Contained 24/7, limitless scale, lead qualification, and “remarkably accurate” claims. | Replaced it with a responsible definition, inputs, good-fit jobs, limits, and maintenance guidance. |
| `/blog/how-to-create-ai-clone` | Promised a complete clone in five minutes. | Replaced it with a seven-step process covering job, audience, scope, knowledge, identity, edge testing, and maintenance. |
| `/blog/ai-clone-vs-chatbot` | Incorrectly treated all chatbots as simple scripts and all clones as superior modern AI. | Rewrote the comparison around job, knowledge, audience, boundaries, and the smallest appropriate system. |
| `/blog/ai-clone-vs-chatgpt` | Needed to match the broader current agent model. | Clarified who each tool serves, how knowledge/publishing differ, and how they can complement one another. |
| `/auth/signup` | Used the older “AI ambassador” label. | Changed the supporting line to start with repeated questions. |
| `/auth/login`, password, and verification pages | Reviewed for stale product promises. | Kept the existing task-specific language because it already matches the current account flow. |
| `/onboarding` | Reviewed against current agent types, purpose, and starter knowledge flow. | Kept the current flow; it already asks for the agent's job, audience, context, and one useful starting point. |
| Dashboard pages | These are product controls, not marketing pages. | Preserved established workflows. Updated the default public intro and removed an inaccurate “unlimited messages” upgrade claim. |
| `/[username]` and `/embed/[username]` | Public content is owner-controlled and must not be globally rewritten. | Preserved the data-driven agent experience; corrected the fallback public metadata and verified the fictional property-guide agent shell. |
| `/privacy` and `/terms` | Reviewed for conflict with current knowledge, document, conversation, and agent behavior. | Preserved the current legal copy because it already describes the implemented platform; no speculative legal rewrite was made. |
| `/create` | Obsolete portfolio/page-builder flow no longer matches the public agent product. | Redirects to current Agent Setup. Logged-out users are correctly sent through login first. |
| `/premium-themes` | Obsolete portfolio-theme gallery conflicts with current agent visual controls. | Redirects to current Visual Style. Logged-out users are correctly sent through login first. |
| `/preview/quickpitch` | Legacy portfolio preview. | Redirects to the current product page. |
| `not-found` and `global-error` | Used jokey/outdated agent copy and a harsh “Critical Error” label. | Replaced with direct, current recovery language. |
| Shared footer and welcome email | Resource labels and onboarding copy leaned heavily on the old clone/digital-twin language. | Updated links and welcome guidance to emphasize knowledge, limits, testing, and current product pages. |

## Shared implementation

- Added one shared marketing header for consistent product, pricing, resource, login, and signup navigation.
- Added one shared audience-page component and data source for the five use-case pages.
- Added one shared resource-article component and data source for the four guides.
- Updated the shared product and feature page data so all generated routes inherit the same messaging.
- Updated the sitemap marketing modification date.

## Verification

- `npm run lint` passed.
- `npm test` passed: 50 tests, 0 failures.
- `npm run build` passed: 72 pages generated.
- Browser-checked every product, feature, audience, company, resource, pricing, FAQ, legal, and primary auth route for one H1, correct title, and horizontal overflow.
- Browser-checked representative homepage, audience, pricing, guide, FAQ, about, press, and signup pages at a mobile viewport; no horizontal overflow was found.
- Verified all six generated feature routes.
- Verified the three legacy redirects.
- Verified the fictional `/theresthouse` public agent shell still renders with its owner-controlled content.
- No browser console errors were recorded during the route sweep.
