## Current State Overview
- Stack: Next.js app router (`app/`), Tailwind CSS, Framer Motion, Supabase auth/data, Lucide icons
- Key routes: `home` (`app/page.jsx`), `create` wizard, `dashboard`, public page (`app/[username]/page.jsx`), `pricing`, `premium-themes`
- Templates: Free templates in `components/Templates.jsx`; Premium in `components/PremiumTemplates.jsx`

## Immediate Fixes (no breaking UX)
- Fix missing export and import issues:
  - Add `socialIcons` mapping and export in `components/Templates.jsx` to match `app/[username]/page.jsx:9`
  - Remove/replace `import { templates } from './Templates'` in `components/ThemeSelector.jsx:7` (no `templates` export exists); use local `themeMetadata` + real component mapping for preview
  - In `app/premium-themes/page.jsx:35–39`, pass actual Lucide icon components (e.g., `Github`, `Linkedin`, `Twitter`) in `demoData.socialLinks` so `<Icon />` renders correctly in premium themes
- Normalize Tailwind color tokens used in UI:
  - Replace or alias invalid classes (`bright-orange`, `cyan-blue`, `amber`, `green`) to defined palette in `tailwind.config.js`, or update usages to valid Tailwind shades (e.g., `orange`, `cyan-500`, `amber-500`, `green-500`)
  - Optionally add `animate-blink` keyframes to `globals.css` or remove the class in `app/page.jsx:109–111`
- Verify client/server boundaries:
  - Ensure any page importing hook-using components starts with `'use client'` (already correct for `create`, `dashboard`, `premium-themes`)

## Theme Redesign (distinct vibes, layouts, and motion)
- Free themes (replace/supplement current set):
  - MonoPress: editorial serif, strict grid, large type, muted palette
  - Aurora Gradient: soft pastel gradients, rounded cards, airy spacing
  - Brutalist: stark blocks, thick borders, monospace accents, minimal motion
  - Card Stack: layered cards with depth, tactile shadows, subtle parallax
  - Split Hero: left/right hero split, sticky summary, vertical rhythm
  - Retro Pixel: playful pixel accents, bright palette, rounded buttons
  - Serif Editorial: magazine-style, drop caps, balanced whitespace
- Premium themes (revamp/extend):
  - Cosmic Flow: keep 3D constellation, add idle power control and performance clamps
  - Glass Morphism: layered blur panes, parallax depth, motion reduced on mobile
  - Neon City: glitch typography with timed pulses, animated grid backdrop
- Implementation: each theme as its own component in `components/Templates.jsx` (free) and `components/PremiumTemplates.jsx` (premium), sharing a common `data` shape already used across the app

## Builder UX Revamp (smoother, brand-aligned)
- Stepper redesign: compact top stepper with icons, clearer progress, consistent brand tokens
- Live preview improvements: persistent side-by-side, debounced data updates, placeholder defaults for empty fields
- Premium upsell: integrate `ThemeSelector` into step 1 with locked tiles and modal upsell using brand visuals; route to pricing/checkout
- Validation & consistency: unify inputs with brand palette, fix invalid tailwind classes, add helper texts and skeletons while loading
- Autosave drafts: save step data to Supabase in a `draft_pages` record; publish on final step

## Payments and Subscriptions
- Integrate Stripe Checkout (or Lemon Squeezy): serverless route for session creation, webhook to mark `profiles.is_premium = true`
- Gating: only allow premium templates when `is_premium` is true; reflect in `create` and `ThemeSelector` and `premium-themes` page
- Update `pricing` CTA to start checkout and handle return URLs

## Publishing & Domains
- Path-based public pages already live at `/{username}` via `app/[username]/page.jsx`
- Add custom domain support: data table for domains, verification flow (DNS CNAME), and mapping in Next/Vercel config
- Add lightweight “copy link” and social share buttons in dashboard

## Analytics & Dashboard
- Use existing Supabase analytics functions; add charts (daily/30-day views) on dashboard and link click tracking visualization
- Add status badges (Published/Draft), last updated, and quick actions (view/edit/share)

## Verification Plan
- Run dev and check: `home`, `create` wizard, `dashboard`, public `/{username}`, `pricing`, `premium-themes`
- Manual test matrix: auth flows, autosave/publish, theme previews (free/premium gating), checkout success/failure, public rendering
- Performance: audit animations for reduced motion and idle pause (already partly implemented), ensure canvas themes clamp work on mobile

## Deliverables in First Implementation Pass
- Fix imports/exports and color tokens
- Update `premium-themes` demo data icons
- Introduce `socialIcons` mapping and wire public page rendering
- Replace invalid tailwind classes or add aliases
- Add at least 3 distinctly redesigned free themes + refine 1 premium
- Wire a basic `Upgrade to Pro` flow stub (non-payment) behind a button to prove gating, then swap to Stripe in the next pass

Confirm this plan and I’ll begin implementing the fixes first, then the theme and builder redesign, followed by payments and domain support.