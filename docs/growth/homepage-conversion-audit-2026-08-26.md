# Qlynk Homepage Conversion Audit

Date: August 26, 2026

Scope: heuristic review of the public homepage structure and copy. This audit did not use private analytics, session recordings, user interviews, or invented conversion benchmarks.

## Conversion objective

The primary homepage job is to help a suitable visitor understand Qlynk, experience a credible answer, and either begin the free trial or continue to a product/pricing page.

The first meaningful product activation should be measured separately: a new user configures an agent, publishes it, and receives genuine visitor questions.

## What was already working

- The hero named the product category: no-code AI agent builder.
- Trial terms were shown directly beneath the primary call to action.
- A live fictional-business demo allowed visitors to experience the product without supplying customer data.
- The page explained approved knowledge, control, publishing and human handoff.
- The FAQ addressed hallucination risk, supported files, updating knowledge, website embedding and pricing.
- Product and pricing links were easy to find in the header.

## Friction identified

### 1. The hero benefit was accurate but abstract

“Business knowledge” is correct, but a new visitor may not immediately map it to the material they already have.

Implemented change: the hero now names FAQs, services, policies and documents as concrete inputs.

### 2. The only hero action required signup intent

The live demo was present lower on the page, but the hero did not offer it as a direct alternative for visitors who needed proof first.

Implemented change: added a secondary “Try the Live Demo” action that moves to the existing demonstration without leaving the page.

### 3. Third-party recognition was not visible

Qlynk’s #1 Project of the Day result was useful early-stage social proof but absent from the product experience.

Implemented change: added a factual recognition badge linking to a milestone note. The wording states the platform, daily placement, date and displayed upvotes without presenting it as proof of customer outcomes.

### 4. The primary call to action described price, not the action

“Start Free” communicates the offer but does not remind the visitor what starts.

Implemented change: the hero call to action now says “Build Your Agent Free.” Global navigation remains shorter to preserve space and consistency.

## Recognition placement implemented

- Homepage hero recognition badge
- Dedicated milestone article
- Press-kit recognition section
- Organization structured-data award text
- Resource index and sitemap inclusion
- Internal links from an existing Qlynk product-update article

## Recommended measurement events

These names are recommendations, not claims that custom analytics has already been implemented:

| Event | Meaning |
|---|---|
| `homepage_primary_cta` | Visitor selects “Build Your Agent Free” |
| `homepage_demo_cta` | Visitor selects “Try the Live Demo” |
| `homepage_award_click` | Visitor opens the recognition article |
| `homepage_demo_question` | Visitor sends a question to the fictional demo |
| `signup_complete` | Account creation completes |
| `agent_configured` | User saves a viable initial configuration |
| `agent_published` | User publishes the agent |
| `first_visitor_conversation` | Published agent receives its first non-owner conversation |

Review the funnel by acquisition source rather than optimizing only for total visits or signups.

## Next experiments after real traffic accumulates

Run one meaningful test at a time and keep pricing, traffic mix and measurement stable enough to interpret the result.

1. Hero audience: broad “customers and teams” copy versus a single high-value wedge such as consultants and agencies.
2. Demo placement: current below-hero section versus a compact example visible inside the first screen on large displays.
3. Signup action: direct signup versus a guided “choose your use case” step.
4. Proof type: directory recognition versus a real, permissioned customer case study once one is available.
5. CTA language: “Build Your Agent Free” versus use-case-specific copy on industry landing pages.

## Evidence still needed

- Visitor-to-signup conversion by source
- Hero CTA versus demo CTA selection
- Demo completion and subsequent signup
- Signup-to-agent configuration
- Configuration-to-publish rate
- Time to first published agent
- First genuine visitor conversation
- Week-one and week-four return behavior
- Permissioned customer outcomes and testimonials

Do not add anonymous testimonials, invented customer counts, fabricated time savings, or unsupported accuracy claims to fill these gaps.

