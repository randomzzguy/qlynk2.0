import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import { fetchPublicText, SafeFetchError } from '@/lib/safe-public-fetch';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30s timeout

// Helper to clean HTML and extract raw text
function cleanHtml(html) {
  // Remove non-content elements and their inner content
  let cleaned = html.replace(/<(script|style|svg|noscript|header|footer|nav|iframe)[^>]*>([\s\S]*?)<\/\1>/gi, ' ');
  
  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  
  // Replace common HTML entities
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&middot;': '·',
    '&bull;': '•',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'"
  };
  
  Object.keys(entities).forEach(entity => {
    cleaned = cleaned.replaceAll(entity, entities[entity]);
  });
  
  // Normalize whitespace (remove multiple spaces and lines)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Limit text size to prevent prompt blowing up (max ~15k chars)
  if (cleaned.length > 15000) {
    cleaned = cleaned.substring(0, 15000) + '... [Scraped Content Truncated]';
  }
  
  return cleaned;
}

// Helper to extract title
function extractTitle(html, url) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    // Clean potential HTML entities in title
    let title = match[1].trim();
    title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return title;
  }
  try {
    const parsed = new URL(url);
    return `Page: ${parsed.hostname}${parsed.pathname}`;
  } catch {
    return 'Scraped Web Page';
  }
}

export async function POST(req) {
  // Rate limit: 5 requests per hour per IP
  const rateLimit = await rateLimitResponse(req, 'scrape', 5, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Format url if protocol is missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Validate URL syntax
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the public page
    let response;
    try {
      response = await fetchPublicText(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 QlynkScraper/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (fetchErr) {
      const safeCode = fetchErr instanceof SafeFetchError ? fetchErr.code : 'FETCH_FAILED';
      console.warn('[Scraper] Request rejected:', safeCode);
      return NextResponse.json({ error: 'Could not access the website. Please make sure the URL is public and correct.' }, { status: 400 });
    }

    if (response.status < 200 || response.status >= 300) {
      return NextResponse.json({ error: `Website returned status ${response.status}. Could not fetch content.` }, { status: 400 });
    }

    const rawContentType = response.headers['content-type'];
    const contentType = Array.isArray(rawContentType) ? rawContentType.join(';') : (rawContentType || '');
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
      return NextResponse.json({ error: 'Only HTML or plain text web pages can be scraped.' }, { status: 400 });
    }

    const html = response.body;
    const title = extractTitle(html, response.url);
    const cleanedText = cleanHtml(html);

    if (!cleanedText || cleanedText.length < 50) {
      return NextResponse.json({ error: 'Could not extract enough meaningful text from the page.' }, { status: 400 });
    }

    // Insert into agent_knowledge table
    const { data, error: dbError } = await supabase
      .from('agent_knowledge')
      .insert({
        user_id: user.id,
        title: title,
        content: cleanedText,
        source_type: 'url',
        source_url: response.url,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Scraper] DB Save Error:', dbError);
      return NextResponse.json({ error: `Failed to save training fact: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      title: title,
      length: cleanedText.length,
      fact: data
    });

  } catch (error) {
    console.error('[Scraper] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
