-- Knowledge Brain Schema: Store facts for the AI Clone
CREATE TABLE IF NOT EXISTS public.agent_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT DEFAULT 'text', -- 'text', 'url', 'file'
    source_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation History: Store chat logs for analytics and context
CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id TEXT, -- For tracking returning anonymous visitors
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security: Enable RLS
ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Public can CREATE conversations and messages (for tracking)
CREATE POLICY "Public can start conversations" ON public.agent_conversations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can send messages" ON public.agent_messages
FOR INSERT WITH CHECK (true);

-- Policies: Owners can manage their own knowledge
CREATE POLICY "Users can manage their own knowledge" ON public.agent_knowledge
FOR ALL USING (auth.uid() = user_id);

-- Policies: Public can READ knowledge (so AI can access it)
CREATE POLICY "Public can read active knowledge" ON public.agent_knowledge
FOR SELECT USING (is_active = true);

-- Policies: Conversation privacy
CREATE POLICY "Owners can view their conversations" ON public.agent_conversations
FOR SELECT USING (auth.uid() = agent_owner_id);

CREATE POLICY "Owners can view message logs" ON public.agent_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.agent_conversations
        WHERE id = agent_messages.conversation_id
        AND agent_owner_id = auth.uid()
    )
);
