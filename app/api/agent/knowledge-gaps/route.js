import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/rate-limit';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'knowledge-gaps-read', 60, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('agent_knowledge_gaps')
    .select('id, question, occurrence_count, status, source_conversation_id, last_seen_at, created_at')
    .eq('user_id', user.id)
    .order('status', { ascending: true })
    .order('last_seen_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load knowledge gaps' }, { status: 500 });
  return NextResponse.json({ gaps: data || [] });
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'knowledge-gaps-write', 30, 60 * 1000);
  if (limited) return limited;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { gapId, action, answer } = await request.json();
    if (typeof gapId !== 'string' || !['resolve', 'dismiss', 'reopen'].includes(action)) {
      return NextResponse.json({ error: 'Invalid knowledge-gap action' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: gap, error: gapError } = await admin
      .from('agent_knowledge_gaps')
      .select('id, question')
      .eq('id', gapId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (gapError || !gap) return NextResponse.json({ error: 'Knowledge gap not found' }, { status: 404 });

    if (action === 'resolve') {
      if (typeof answer !== 'string' || !answer.trim() || answer.length > 8000) {
        return NextResponse.json({ error: 'Add an approved answer before resolving this gap' }, { status: 400 });
      }
      const { data: createdKnowledge, error: knowledgeError } = await admin.from('agent_knowledge').insert({
        user_id: user.id,
        title: gap.question,
        content: answer.trim(),
        source_type: 'faq',
        category: 'knowledge-gap',
        priority: 4,
        is_active: true,
      }).select('id').single();
      if (knowledgeError) throw knowledgeError;
      gap.createdKnowledgeId = createdKnowledge.id;
    }

    const nextStatus = action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : 'open';
    const update = {
      status: nextStatus,
      resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null,
    };
    if (nextStatus === 'open') update.last_seen_at = new Date().toISOString();
    const { error: updateError } = await admin.from('agent_knowledge_gaps').update(update).eq('id', gap.id).eq('user_id', user.id);
    if (updateError) {
      if (gap.createdKnowledgeId) {
        await admin.from('agent_knowledge').delete().eq('id', gap.createdKnowledgeId).eq('user_id', user.id);
      }
      throw updateError;
    }

    return NextResponse.json({ status: nextStatus });
  } catch (error) {
    console.error('[Knowledge Gaps] Update failed:', error);
    return NextResponse.json({ error: 'Unable to update the knowledge gap' }, { status: 500 });
  }
}
