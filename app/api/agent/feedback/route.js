import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/i;

export async function POST(request) {
  const rateLimit = await rateLimitResponse(request, 'agent-feedback', 20, 60 * 1000);
  if (rateLimit) return rateLimit;

  try {
    const { username, visitorId, conversationId, assistantContent, rating, reason } = await request.json();
    if (!USERNAME_PATTERN.test(username || '') || !UUID_PATTERN.test(visitorId || '') || !UUID_PATTERN.test(conversationId || '')) {
      return NextResponse.json({ error: 'Invalid feedback context' }, { status: 400 });
    }
    if (![1, -1].includes(rating) || typeof assistantContent !== 'string' || !assistantContent.trim() || assistantContent.length > 8000) {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    }
    if (reason != null && (typeof reason !== 'string' || reason.length > 500)) {
      return NextResponse.json({ error: 'Feedback reason is too long' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('id').ilike('username', username).maybeSingle();
    if (!profile) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const { data: conversation } = await admin
      .from('agent_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('agent_owner_id', profile.id)
      .eq('visitor_id', visitorId)
      .maybeSingle();
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { data: messages, error: messageError } = await admin
      .from('agent_messages')
      .select('id, content')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(12);
    if (messageError) throw messageError;

    const targetMessage = (messages || []).find((message) => message.content.trim() === assistantContent.trim());
    if (!targetMessage) return NextResponse.json({ error: 'Response not found' }, { status: 404 });

    const visitorKeyHash = createHash('sha256').update(`${profile.id}:${visitorId}`).digest('hex');
    const { error: feedbackError } = await admin.from('agent_message_feedback').upsert({
      agent_owner_id: profile.id,
      conversation_id: conversationId,
      message_id: targetMessage.id,
      visitor_key_hash: visitorKeyHash,
      rating,
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'message_id,visitor_key_hash' });
    if (feedbackError) throw feedbackError;

    return NextResponse.json({ rating });
  } catch (error) {
    console.error('[Agent Feedback] Failed:', error);
    return NextResponse.json({ error: 'Unable to save feedback' }, { status: 500 });
  }
}
