import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  const rateLimit = await rateLimitResponse(request, 'conversation-owner-reply', 30, 60 * 1000);
  if (rateLimit) return rateLimit;

  const { conversationId } = await params;
  if (!UUID_PATTERN.test(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation identifier' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 4_000) {
    return NextResponse.json(
      { error: 'Reply must contain between 1 and 4000 characters' },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();
  const { data: conversation, error: conversationError } = await adminSupabase
    .from('agent_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('agent_owner_id', user.id)
    .maybeSingle();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { error: insertError } = await adminSupabase
    .from('agent_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
      sender_type: 'owner',
    });

  if (insertError) {
    console.error('[Conversation Reply] Insert failed:', insertError.message);
    return NextResponse.json({ error: 'Unable to save reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
