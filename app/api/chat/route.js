import { streamText, convertToModelMessages } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createClient } from '@/utils/supabase/server';
import { buildAgentSystemPrompt, getAgentDocuments } from '@/lib/agent';
import { cookies } from 'next/headers';
import { canSendMessage, PLAN_LIMITS } from '@/lib/subscriptionHelpers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const getGroqClient = () => {
  return createGroq({
    apiKey: process.env.GROQ_API_KEY || 'gsk_placeholder_for_build',
  });
};

export async function POST(req) {
  try {
    const { messages, username, conversationId, visitorId } = await req.json();
    
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get the profile for this username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the agent config
    const { data: config, error: configError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (configError || !config || !config.is_enabled) {
      return new Response(JSON.stringify({ error: 'Agent not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ENFORCE USAGE LIMITS
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, messages_used')
      .eq('user_id', profile.id)
      .single();

    if (subscription) {
      const limit = PLAN_LIMITS[subscription.tier.toLowerCase()] || 0;
      if ((subscription.messages_used || 0) >= limit) {
        return new Response(JSON.stringify({ error: 'Message limit reached. Please upgrade to continue.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get documents for knowledge base
    const { documents } = await getAgentDocuments(profile.id);

    // Build the system prompt
    const systemPrompt = buildAgentSystemPrompt(config, documents);

    // Handle conversation tracking
    let activeConversationId = conversationId;
    
    if (!activeConversationId && visitorId) {
      // Create a new conversation
      const { data: newConv } = await supabase
        .from('agent_conversations')
        .insert({
          agent_owner_id: profile.id,
          visitor_id: visitorId,
        })
        .select('id')
        .single();
      
      activeConversationId = newConv?.id;
    }

    // Save the user message
    if (activeConversationId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage) {
        // Extract text from the message parts
        const content = lastUserMessage.parts
          ?.filter(p => p.type === 'text')
          .map(p => p.text)
          .join('') || lastUserMessage.content || '';
        
        if (content) {
          await supabase.from('agent_messages').insert({
            conversation_id: activeConversationId,
            role: 'user',
            content,
          });

          // Update message count
          await supabase
            .from('agent_conversations')
            .update({ message_count: messages.length })
            .eq('id', activeConversationId);
        }
      }
    }

    // Stream the response
    const groq = getGroqClient();
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ text }) => {
        // Save the assistant message
        if (activeConversationId && text) {
          await supabase.from('agent_messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: text,
          });

          // Increment usage using Admin client to bypass RLS
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );

          await supabaseAdmin.rpc('increment_messages_used', { 
            owner_id: profile.id 
          });
        }
      },
    });
  } catch (error) {
    console.error('[v0] Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
