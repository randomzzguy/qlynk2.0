import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rate-limit';
import dns from 'node:dns/promises';
import net from 'node:net';

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

function isPrivateIp(ip) {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 0) return true;
    return false;
  }

  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe80')) return true;
    if (normalized === '::') return true;
  }

  return false;
}

async function validatePublicTargetUrl(targetUrl) {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  ) {
    return { ok: false, reason: 'Local addresses are not allowed.' };
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, reason: 'Private IP addresses are not allowed.' };
    }
    return { ok: true };
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    return { ok: false, reason: 'Could not resolve host.' };
  }

  if (addresses.some(({ address }) => isPrivateIp(address))) {
    return { ok: false, reason: 'Private or internal hosts are not allowed.' };
  }

  return { ok: true };
}

export async function POST(req) {
  // Rate limit: 5 requests per hour per IP
  const rateLimit = rateLimitResponse(req, 'scrape', 5, 60 * 60 * 1000);
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

    try {
      const targetValidation = await validatePublicTargetUrl(targetUrl);
      if (!targetValidation.ok) {
        return NextResponse.json({ error: targetValidation.reason }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Unable to validate target host' }, { status: 400 });
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
      response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 QlynkScraper/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        next: { revalidate: 0 } // Bypass caching
      });
    } catch (fetchErr) {
      console.error('[Scraper] Fetch error:', fetchErr);
      return NextResponse.json({ error: 'Could not access the website. Please make sure the URL is public and correct.' }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Website returned status ${response.status}. Could not fetch content.` }, { status: 400 });
    }

    try {
      const finalValidation = await validatePublicTargetUrl(response.url || targetUrl);
      if (!finalValidation.ok) {
        return NextResponse.json({ error: 'Redirected target is not allowed.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Redirect validation failed.' }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
      return NextResponse.json({ error: 'Only HTML or plain text web pages can be scraped.' }, { status: 400 });
    }

    const html = await response.text();
    const title = extractTitle(html, targetUrl);
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
        source_url: targetUrl,
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
