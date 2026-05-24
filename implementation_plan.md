# Implementation Plan - Production Polishing & Launch Readiness

This plan outlines the final, premium additions to prepare Qlynk for production launch. It introduces **URL Scraping as a Knowledge Source**, **Asynchronous AI Sentiment Analysis**, and **CSV Export** for conversation logs.

## User Review Required

> [!NOTE]
> URL scraping is implemented natively using standard Node.js `fetch` and direct text/HTML processing. This ensures it requires **zero external npm dependencies** (no puppeteer or cheerio required), maintaining high security, fast compilation, and lightweight cloud deployments.

> [!TIP]
> Sentiment Analysis runs **asynchronously in the background** inside the Edge API route *after* streaming the chat response to the user. This ensures zero latency or delay for the visitor's chat experience, while immediately updating the analytics and conversations dashboard with high-accuracy sentiment tags.

---

## Proposed Changes

### Component: URL Scraping Engine

#### [NEW] [route.js](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/app/api/scrape/route.js)
- Implements a POST endpoint that takes a `url`.
- Validates the user's session.
- Performs a secure `fetch` to retrieve the HTML.
- Extracts the `<title>` tag to use as the fact's title.
- Cleans and strips HTML elements, scripts, styles, and extra whitespace to get the raw body text.
- Inserts a new row directly into `agent_knowledge` with:
  - `title`: Extracted title or URL hostname.
  - `content`: Cleaned text content.
  - `source_type`: `'url'`.
  - `source_url`: The original URL.
  - `user_id`: The logged-in user.

#### [MODIFY] [page.jsx](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/app/dashboard/knowledge/page.jsx)
- Extends the `KnowledgeDashboard` to support a third tab: `links`.
- Provides a high-end input form for URLs ("Add website, portfolio, blog post, etc.").
- Calls the `/api/scrape` endpoint with loading spinner states and beautiful `react-hot-toast` notifications.
- Displays all scraped URL cards in a responsive grid featuring:
  - The page title and origin hostname.
  - A clickable external link icon.
  - A dynamic domain icon generator (visual domain favicon).
  - Quick action buttons to preview the scraped content or delete the record.

---

### Component: Asynchronous Sentiment Analyzer

#### [MODIFY] [route.js](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/app/api/ai-chat/route.js)
- In the `TransformStream`'s `flush()` method (which runs after the full AI response has streamed back to the browser):
  - Fetches the compiled message history of the current `conversationId` from `agent_messages`.
  - Fires an asynchronous, non-blocking call to the Groq Llama-3 API.
  - Instructs the LLM to analyze the visitor's tone and return exactly one of `'positive'`, `'neutral'`, or `'negative'`.
  - Updates the `sentiment` column in the `agent_conversations` table with the predicted tag.
- Since this runs post-stream and in the background, it adds **0ms** of latency to the end-user's chat widget.

---

### Component: Export Conversations

#### [MODIFY] [page.jsx](file:///c:/Users/hhcre/Desktop/Zeyad/qlynk/webappLATEST/app/dashboard/conversations/page.jsx)
- Implements a premium "Export CSV" button in the Conversations page header.
- Compiles the full history of conversation sessions including visitor name, email, location, message count, sentiment, and date.
- Dynamically generates and triggers a client-side CSV file download.

---

## Verification Plan

### Automated Verification
- Run a production build check to ensure all code compiles cleanly:
  ```powershell
  npm run build
  ```

### Manual Verification
1. **URL Scraping**: Navigate to the Knowledge Base, switch to the "Links" tab, paste a public URL (e.g., `https://example.com`), and verify that the page title and content are parsed, scraped, and saved correctly.
2. **Sentiment Analysis**: Start a new chat on your public agent page. Send a highly enthusiastic message ("I absolutely love this, it's incredible!") and a frustrated one, then check the Conversations and Analytics dashboards to verify that the conversation immediately receives the correct colored `positive` / `negative` tags.
3. **CSV Export**: Open the Conversations tab, click "Export CSV", and verify the downloaded spreadsheet contains accurate details.
