# Qlynk 2.0 AI & Dashboard Development Skills Reference

This file serves as a project-specific reference guide for both human developers and AI coding assistants. Read this file first to understand the database structure, API contracts, styling practices, and logic implementations. Using this file prevents redundant file-reads and directory traversals, significantly optimizing workflow and reducing token usage.

---

## 📂 Project Directory Structure & Key Files

- `app/` - Next.js App Router Pages and APIs
  - `app/api/ai-chat/route.js` - Groq AI chat API endpoint (handles SSE streams and persists chat messages)
  - `app/[username]/page.jsx` - Public creator/founder/freelancer page with the chat widget
  - `app/dashboard/` - Main settings panel: agent config, analytics, billing, conversations, knowledge base
  - `app/embed/[username]/` - Standalone chat widget route for iframe embeds
- `components/` - Shared UI Elements
  - `components/ChatWidget.jsx` - Floating chat bubble component (manages socket-free streaming UI, colors, localStorage)
  - `components/DynamicForm.jsx` - Generates theme-specific edit forms based on Zod/form schemas
- `lib/` - Logic, Helpers & Configs
  - `lib/agent.js` - Agent prompt builder (`buildAgentSystemPrompt`), configuration getters, conversation/message DB helpers
  - `lib/plans.js` - Subscription tiers, message limits, subscription status helpers
  - `lib/stripe.js` - Stripe initialization
  - `lib/supabase.js` - Browser-client auth and page-creation wrappers
  - `lib/themeSchemas.js` - Zod schema validators for all page themes (24KB)
  - `lib/themeRegistry.js` - Register of all themes across the 4 main categories
- `utils/supabase/` - Server & Client DB Initialization
  - `utils/supabase/server.ts` - Server-side Supabase clients (standard user client and admin bypass client)
  - `utils/supabase/client.ts` - Client-side browser Supabase client
  - `utils/supabase/middleware.ts` - Handles auth session refresh for Next.js routing

---

## 🗄️ Database Schema & RLS Quick Reference

### 1. `profiles`
- **Columns**:
  - `id` UUID PRIMARY KEY (references `auth.users(id)`)
  - `username` TEXT UNIQUE
  - `email` TEXT
  - `avatar_url` TEXT
  - `onboarding_completed` BOOLEAN DEFAULT false
  - `onboarding_step` TEXT
  - `created_at`, `updated_at` TIMESTAMPTZ
- **RLS Policies**:
  - `Public profiles are viewable by everyone` (SELECT: `true`)
  - Owners can UPDATE/INSERT their own profile.

### 2. `pages`
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `user_id` UUID UNIQUE (references `auth.users(id)`)
  - `name`, `profession`, `tagline`, `bio`, `profile_image`, `email`, `phone` TEXT
  - `cta_text`, `cta_link` TEXT
  - `theme` TEXT (matches theme registry IDs)
  - `theme_category` VARCHAR(50) DEFAULT 'freelancers'
  - `theme_data` JSONB NOT NULL DEFAULT `'{"config_version": "v1"}'`
  - `is_published` BOOLEAN DEFAULT true
- **RLS Policies**:
  - `Public pages are viewable by everyone` (SELECT: `true`)
  - Owners can INSERT/UPDATE/DELETE.

### 3. `agent_configs`
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `user_id` UUID UNIQUE (references `auth.users(id)`)
  - `agent_name` TEXT, `agent_avatar` TEXT, `welcome_message` TEXT, `bio` TEXT
  - `skills` JSONB, `projects` JSONB, `contact_info` JSONB, `social_links` JSONB
  - `custom_knowledge` TEXT
  - `is_enabled` BOOLEAN DEFAULT false
  - `access_level` TEXT DEFAULT 'public' ('public', 'password', 'email')
  - `access_password` TEXT
  - **Visual Styles**: `chat_bg_color`, `user_bubble_color`, `ai_bubble_color`, `cta_button_color`, `cta_text_color`, `pre_chat_text_color`, `gatekeeper_text_color`, `font_family` (all TEXT)
- **RLS Policies**:
  - `Public read for enabled agents` (SELECT: `is_enabled = true`)
  - Owners can perform ALL operations.

### 4. `agent_knowledge` (Manual facts)
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `user_id` UUID (references `auth.users(id)`)
  - `title` TEXT, `content` TEXT
  - `source_type` TEXT DEFAULT 'text' ('text', 'url', 'file')
  - `source_url` TEXT, `is_active` BOOLEAN DEFAULT true
- **RLS Policies**:
  - `Public can read active knowledge` (SELECT: `is_active = true`)
  - Owners can perform ALL operations.

### 5. `agent_documents` (Extracted files)
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `user_id` UUID (references `auth.users(id)`)
  - `filename` TEXT, `file_type` TEXT, `file_size` INTEGER
  - `storage_path` TEXT, `extracted_text` TEXT, `is_processed` BOOLEAN DEFAULT false
- **RLS Policies**:
  - Owners can perform ALL operations. No public access.

### 6. `agent_conversations` (Chat tracker)
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `agent_owner_id` UUID (references `auth.users(id)`)
  - `visitor_id` TEXT (localStorage tracked ID)
  - `visitor_name` TEXT, `visitor_email` TEXT, `visitor_ip` TEXT, `visitor_location` TEXT, `visitor_device` TEXT
  - `message_count` INTEGER DEFAULT 0
- **RLS Policies**:
  - `Public can start conversations` (INSERT: `true`)
  - `Owners can view their conversations` (SELECT: `auth.uid() = agent_owner_id`)

### 7. `agent_messages` (Message history)
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `conversation_id` UUID (references `agent_conversations(id)`)
  - `role` TEXT ('user', 'assistant')
  - `content` TEXT
- **RLS Policies**:
  - `Public can send messages` (INSERT: `true`)
  - `Owners can view message logs` (SELECT: conversation owner matching `auth.uid()`)

### 8. `subscriptions`
- **Columns**:
  - `id` UUID PRIMARY KEY
  - `user_id` UUID UNIQUE (references `auth.users(id)`)
  - `tier` TEXT DEFAULT 'trial' ('trial', 'creator', 'pro', 'agency', 'business')
  - `status` TEXT DEFAULT 'trialing' ('active', 'trialing', 'canceled', 'paused')
  - `trial_ends_at` TIMESTAMPTZ, `messages_used` INTEGER DEFAULT 0
  - `post_trial_choice` TEXT
- **RLS Policies**:
  - Owners can view (`auth.uid() = user_id`). Updates restricted to admin client.

### ⚡ Critical Database Trigger (`update_conversation_message_count`)
Runs on `INSERT` of messages into `agent_messages`:
1. Increments `message_count` in `agent_conversations`.
2. **Automated Usage Tracker**: If the inserted message role is `'user'`, it automatically increments `messages_used` in the owner's `subscriptions` table.
> **DO NOT** manually increment subscription usage in backend API endpoint code — the database trigger handles it on user message insertion.

---

## 🔌 Supabase Client Instantiation Skills

- **Client Component (Browser)**:
  ```javascript
  import { createClient } from '@/utils/supabase/client';
  const supabase = createClient();
  ```
- **Server Context (Server Components, Route Handlers, Actions)**:
  ```javascript
  import { createClient } from '@/utils/supabase/server';
  import { cookies } from 'next/headers';
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  ```
- **Admin Context (RLS Bypass)**:
  ```javascript
  import { createAdminClient } from '@/utils/supabase/server';
  const adminSupabase = createAdminClient();
  ```

---

## 🎨 Theme Registry & Schema Skills

User pages have configurations dictated by templates:
- **Theme Categories**: `freelancers`, `portfolios`, `products`, `businesses`.
- **Register location**: [themeRegistry.js](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/lib/themeRegistry.js).
- **Zod schemas**: Live in [themeSchemas.js](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/lib/themeSchemas.js).
- **Validation Wrapper**:
  ```javascript
  import { validateThemeData } from '@/lib/themeSchemas';
  try {
    const validatedData = validateThemeData(themeId, {
      config_version: 'v1',
      ...themeData
    });
    // save to pages.theme_data
  } catch (err) {
    // handle Zod validation error
  }
  ```
- **Version Control**: Every theme JSON blob requires the `"config_version": "v1"` property for future migration compatibility.

---

## 🤖 AI Chat Pipeline & API Contract

- **Endpoint**: `POST /api/ai-chat`
- **Request payload**:
  ```json
  {
    "messages": [{"role": "user", "content": "..."}],
    "username": "string",
    "visitorId": "uuid",
    "conversationId": "uuid", // optional
    "visitorName": "string",   // optional gatekeeper metadata
    "visitorEmail": "string",  // optional gatekeeper metadata
    "accessPassword": "string" // optional password if access_level = 'password'
  }
  ```
- **Stream Persistence Details**:
  The route returns an SSE response using a stream. It pipes the stream via `createAssistantPersistenceStream` in [route.js](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/app/api/ai-chat/route.js). Once the stream ends, it inserts the accumulated assistant response back to `agent_messages` automatically.

---

## 💳 Subscriptions & Plan Limits

- **Plan Tiers**: `trial`, `creator`, `pro`, `agency`, `business`.
- **Usage Limits**:
  - `trial`: 1000 messages / month
  - `creator` / `pro`: 5000 messages / month
  - `agency` / `business`: 10000 messages / month
- **Live Checking**:
  ```javascript
  import { isSubscriptionLive } from '@/lib/plans';
  const isLive = isSubscriptionLive(subscription); // checks tier, status, trial_ends_at
  ```

---

## ⚡ Token Reduction Guidelines for AI Agents

1. **Avoid full scans of `themeSchemas.js` or `themeFormFields.js`**: These files are massive (24KB and 47KB). Refer to the schema overview in this file instead of loading them.
2. **Reference paths using markdown links**: When describing imports, use clickable paths so the user or agent can click them.
3. **Database Column Lookups**: Trust this file's schema mappings. Do not invoke SQL execution, table descriptions, or migration checks to find columns.
4. **Predev build scripts**: Running `npm run dev` automatically triggers the pre-clean script `predev: "node ./scripts/clear-next-lock.js"`.
