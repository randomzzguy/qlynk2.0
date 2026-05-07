# Copilot instructions — Qlynk webapp

This file contains concise, actionable guidance for AI coding agents working on this repository.

Overview
- Framework: Next.js (App Router) with React components in `app/` and `components/`.
- Styling: Tailwind CSS (`globals.css`, `tailwind.config.js`) and `lib/utils.ts` helper `cn()` for merged classNames.
- Data backend: Supabase client in `lib/supabase.js` (uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Public pages: dynamic username route under `app/[username]/page.jsx` (public profile rendering using `complete_pages` view).

Architecture & key flows
- App-level layout: [app/layout.jsx] provides global UI: `QlynkBackground`, `AnimationControl`, `ToasterClient`.
- Page creation flow: `lib/supabase.js:createPage()` ensures a `profiles` row exists, inserts `pages`, then `social_links` and `custom_links`.
  - Creating/updating pages uses `pages`, `social_links`, `custom_links` tables and returns username for public URL.
- Public read path: `lib/supabase.js:getPageByUsername()` first queries `complete_pages` view (fast path) and falls back to assembling from base tables.
  - Note: code attempts best-effort view tracking via RPC `increment_page_views`.
- Auth: handled via `supabase.auth` helpers in `lib/supabase.js` (`signUp`, `signIn`, `signOut`, `getCurrentUser`).

Project-specific conventions
- Mix of client and server components: files that require browser APIs include `'use client'` (see [app/page.jsx]).
- Templates: multiple theme components live in `components/Templates.jsx` (exports like `NoirTemplate`, `ZineTemplate`, `PaperTemplate`, etc.). When adding templates export both canonical and legacy names (repo keeps compatibility exports).
- Tailwind patterns: prefer `cn()` from `lib/utils.ts` to merge classNames with `twMerge` and `clsx`.
- Database expectations: many operations assume `profiles` and `pages` foreign-key relationship; ensure migrations keep these constraints.

Developer workflows & commands
- Start dev server: `npm run dev` (Next dev server on http://localhost:3000).
- Build for production: `npm run build` then `npm run start` (standard Next.js scripts — check `package.json` if scripts differ).
- Environment variables required for local dev: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Integration points & important files to inspect
- `lib/supabase.js` — central supabase client + domain logic (auth, pages CRUD, username checks). Use for DB-related changes.
- `components/Templates.jsx` — authoritative source of public page templates; keep export names stable for compatibility.
- `app/[username]/page.jsx` — public render path (uses `getPageByUsername` pattern). Changes here affect public URLs.
- `app/layout.jsx` and `components/*` — global UI/animations; prefer small iterative changes to avoid layout regressions.

Testing and debugging hints
- UI debugging: run `npm run dev` and open http://localhost:3000; inspect network calls to Supabase keys and RPCs.
- Data debugging: prefer to use Supabase dashboard to inspect `complete_pages` view and underlying tables when troubleshooting missing fields.
- When updating DB-related code in `lib/supabase.js`, add local validation that falls back safely (functions already return `{ data, error }` objects).

Examples (copy-paste friendly)
- Create page call pattern: `import { createPage } from 'lib/supabase'; await createPage(pageData)` — handles profile creation internally.
- Public read pattern: `import { getPageByUsername } from 'lib/supabase'; const { data } = await getPageByUsername('alice')` — `data` may come from `complete_pages` view.

If something is unclear
- Ask which area to expand (auth, DB views, templates, or global layout). Provide a small code change request and I will update this file.

EOF
